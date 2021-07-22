import { Server as HTTPServer } from "http";
import { performance } from "perf_hooks";
import { Server as SocketServer, Socket } from "socket.io";
import { getPlayingSounds, getSession, Pad } from "./sessions";
import { isSubsetOf } from "./utils";

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
    const { host, clientFiles, files } = getSession(sessionID);
    if (!host) return;
    const isSynced = Object.values(clientFiles).every((singleClientFiles) =>
      isSubsetOf(files, singleClientFiles)
    );
    socketServer.to(host).emit("isSynced", isSynced);
  }

  /**
   * Send an update on the current state of a session to every client in
   * that session except the host.
   */
  function updateClients(sessionID: string) {
    const session = getSession(sessionID);
    if (!session.host) return;
    socketServer
      .to(sessionID)
      .except(session.host)
      .emit("filesUpdate", session.files, getPlayingSounds(session));
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
        session.host = socket.id;
        socket.emit("filesUpdate", session.files, getPlayingSounds(session));
        socket.emit("padsUpdate", session.pads);
        console.log("replied with", session.files);
      } else if (role === "guest") {
        console.log("Got hello from client!", socket.id, sessionID, role);
        socket.sessionID = sessionID;
        socket.join(sessionID);
        const session = getSession(sessionID);
        socket.emit("filesUpdate", session.files, getPlayingSounds(session));
        console.log("replied with", session.files);
      } else {
        console.warn("Role should be either 'host' or 'guest', was " + role);
      }
    });

    socket.on("gotFiles", (files) => {
      if (!socket.sessionID) return;
      console.log(`${socket.id} loaded files ${files}`);
      updateHost(socket.sessionID);
      const session = getSession(socket.sessionID);
      socket.emit("filesUpdate", session.files, getPlayingSounds(session));
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.sessionID);
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
      session.pads = pads;
      updateHost(session.sessionID);
    });

    socket.on("stopAll", () => {
      const session = getSession(socket.sessionID || "");
      if (!session) return;

      session.playing = {};
      socket.to(session.sessionID).emit("stopAll");
    });
  });

  return { updateClientsAndHost };
}
