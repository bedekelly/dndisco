import { Server as HTTPServer } from "http";
import { performance } from "perf_hooks";
import { Server as SocketServer, Socket } from "socket.io";
import { getPadSounds, getPlayingSounds, getSession, Pad } from "./sessions";
import { isSubsetOf } from "./utils";
import { randomUUID } from "crypto";
import { makePlaylist, Playlist } from "./playlists";
import _ from "lodash";

type SocketWithSessionID = Socket & { sessionID?: string };

/**
 * Given an HTTP server to piggyback from, create a websocket server to
 * manage all the realtime traffic between host, server and clients.
 */
export default function setupWebsockets(httpServer: HTTPServer) {
  const socketServer = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  /**
   * Update the host of a session with the list of files that the server
   * currently has, as well as the files
   */
  function updateHost(sessionID: string) {
    const { hosts, clientFiles, files } = getSession(sessionID);
    if (!hosts.size) return;
    const soundsAreSynced = Object.values(clientFiles).every(
      (singleClientFiles) => {
        const result = isSubsetOf([...files], singleClientFiles);
        if (!result) {
          console.log({ files, singleClientFiles });
        }
        return result;
      }
    );
    const clientsConnected = Object.keys(clientFiles).length;
    console.log({ clientsConnected, soundsAreSynced });
    socketServer
      .to([...hosts])
      .emit("isSynced", soundsAreSynced, clientsConnected);
  }

  /**
   * Send an update on the current state of a session to every client in
   * that session except the host.
   */
  function updateClients(sessionID: string) {
    const session = getSession(sessionID);
    if (!session.hosts.size) return;
    socketServer
      .to(sessionID)
      .except([...session.hosts])
      .emit("filesUpdate", getPadSounds(session), getPlayingSounds(session));
  }

  function updateClientsAndHost(sessionID: string) {
    updateClients(sessionID);
    updateHost(sessionID);
  }

  socketServer.on("connection", (socket: SocketWithSessionID) => {
    console.log("Connection from ", socket.id);
    socket.emit("whoAreYou", (sessionID: string, role: "host" | "guest") => {
      console.log("got whoareyou response", sessionID, role);
      if (role === "host") {
        console.log("got hello from host");
        socket.sessionID = sessionID;
        socket.join(sessionID);
        const session = getSession(sessionID);
        session.hosts.add(socket.id);
        socket.emit(
          "filesUpdate",
          getPadSounds(session),
          getPlayingSounds(session)
        );
        socket.emit("playlistsUpdate", Object.keys(session.playlists));
        socket.emit("padsUpdate", session.pads);
        console.log("replied with", session.files);
      } else if (role === "guest") {
        console.log("Got hello from client!", socket.id, sessionID, role);
        socket.sessionID = sessionID;
        socket.join(sessionID);

        const session = getSession(sessionID);
        session.clientFiles[socket.id] = [];
        socket.emit(
          "filesUpdate",
          getPadSounds(session),
          getPlayingSounds(session)
        );
        updateHost(session.sessionID);
        console.log("replied with", session.files);
      } else {
        console.warn("Role should be either 'host' or 'guest', was " + role);
      }
    });

    socket.on("gotFiles", (files) => {
      if (!socket.sessionID) return;
      const session = getSession(socket.sessionID);
      session.clientFiles[socket.id] = files;
      updateHost(socket.sessionID);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.sessionID);
      if (!socket.sessionID) return;
      const session = getSession(socket.sessionID);
      delete session.clientFiles[socket.id];
      updateHost(session.sessionID);
    });

    socket.on("play", (soundID: string) => {
      const { sessionID } = socket;
      if (!sessionID) {
        console.warn("Got play message from socket without a sessionID");
        return;
      }
      const session = getSession(sessionID);
      session.playing[soundID] = performance.now();
      console.log("Playing", soundID);
      socket.to(sessionID).emit("play", soundID);
    });

    socket.on("stop", (soundID: string) => {
      const { sessionID } = socket;
      if (!sessionID) return;
      const session = getSession(sessionID);
      delete session.playing[soundID];
      console.log("Stopping", soundID);
      socket.to(sessionID).emit("stop", soundID);
    });

    socket.on("padUpdate", (pads: Pad[]) => {
      const session = getSession(socket.sessionID || "");
      if (!session) return;

      // Check for equality so we don't loop infinitely.
      if (!_.isEqual(session.pads, pads)) {
        const oldPadSounds = session.pads.map((pad) => pad.soundID);
        const newPadSounds = new Set(pads.map((pad) => pad.soundID));
        oldPadSounds.forEach((oldPadSound) => {
          if (oldPadSound && !newPadSounds.has(oldPadSound)) {
            session.files.delete(oldPadSound);
          }
        });
        session.pads = pads;
        updateClientsAndHost(session.sessionID);
      }
    });

    socket.on("createPlaylist", (cb: (playlistID: string) => void) => {
      const playlistID = randomUUID();
      console.log("Creating playlist", playlistID);
      const { sessionID } = socket;
      if (!sessionID) {
        console.warn("Tried to create a playlist without a session ID");
        return;
      }
      const session = getSession(sessionID);
      session.playlists[playlistID] = makePlaylist();
      cb(playlistID);
    });

    socket.on("getPlaylists", (cb: (playlists: string[]) => void) => {
      const session = socket.sessionID && getSession(socket.sessionID);
      if (!session) {
        console.warn("Tried to get playlists before a session exists");
        return cb([]);
      }
      cb(Object.keys(session.playlists));
    });

    socket.on(
      "getPlaylist",
      (playlistID: string, cb: (playlist: Playlist | null) => void) => {
        const session = getSession(socket.sessionID || "");
        if (!session) return cb(null);
        const playlist = session.playlists[playlistID];
        const now = performance.now();
        if (!playlist) return cb(null);
        if (playlist.currentlyPlaying)
          playlist.currentlyPlaying.offset =
            performance.now() - (playlist.currentlyPlaying?.startedAt || now);

        cb(playlist);
      }
    );

    socket.on(
      "updatePlaylist",
      (
        playlistID: string,
        newData: Playlist,
        startOfSong: boolean,
        done?: (playlist: Playlist) => void
      ) => {
        const session = socket.sessionID && getSession(socket.sessionID);
        if (!session) {
          console.warn("Tried to update playlist without a session.");
          return;
        }

        if (newData.currentlyPlaying && startOfSong) {
          newData.currentlyPlaying.startedAt = performance.now();
        } else if (newData.currentlyPlaying != null) {
          newData.currentlyPlaying =
            session.playlists[playlistID].currentlyPlaying;
        }

        console.log("newData", newData);
        const oldEntries = session.playlists[playlistID].entries;
        const newEntries = new Set(newData.entries);

        for (let oldEntry of oldEntries) {
          if (!newEntries.has(oldEntry)) {
            session.files.delete(oldEntry);
          }
        }

        session.playlists[playlistID] = newData;
        console.log(newData);
        updateClients(session.sessionID);
        done?.(session.playlists[playlistID]);
      }
    );

    socket.on("stopAll", () => {
      const session = getSession(socket.sessionID || "");
      if (!session) return;

      session.playing = {};
      socket.to(session.sessionID).emit("stopAll");
    });
  });

  return { updateClientsAndHost };
}
