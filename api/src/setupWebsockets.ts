import { Server as HTTPServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { getSession } from "./sessions";
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
    const { host, files } = getSession(sessionID);
    if (!host) return;
    socketServer.to(sessionID).except(host).emit("filesUpdate", files);
  }

  function updateClientsAndHost(sessionID: string) {
    updateClients(sessionID);
    updateHost(sessionID);
  }

  socketServer.on("connection", (socket: SocketWithSessionID) => {
    console.log("Connection from ", socket.id);
    socket.on(
      "hostHello",
      (sessionID: string, replyWith: (arg: any) => void) => {
        console.log("got hello from host");
        socket.sessionID = sessionID;
        socket.join(sessionID);
        const session = getSession(sessionID);
        session.host = socket.id;
        replyWith(session.files);
        console.log("replied with", session.files);
      }
    );

    socket.on("clientHello", (sessionID: string) => {
      console.log("Got hello from client!", socket.id);
      socket.sessionID = sessionID;
      socket.join(sessionID);
      const session = getSession(sessionID);
      socket.emit("filesUpdate", session.files);
      console.log("replied with", session.files);
    });

    socket.on("gotFiles", (files) => {
      if (!socket.sessionID) return;
      console.log(`${socket.id} loaded files ${files}`);
      updateHost(socket.sessionID);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.sessionID);
    });

    socket.on("play", (soundID: string) => {
      const { sessionID } = socket;
      if (!sessionID) return;
      console.log("Playing", soundID);
      socket.to(sessionID).emit("play", soundID);
    });

    socket.on("stop", (soundID: string) => {
      const { sessionID } = socket;
      if (!sessionID) return;
      console.log("Stopping", soundID);
      socket.to(sessionID).emit("stop", soundID);
    });
  });

  return { updateClientsAndHost };
}
