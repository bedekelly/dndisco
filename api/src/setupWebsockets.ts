import { Server as HTTPServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { getSession } from "./sessions";

type SocketWithSessionID = Socket & { sessionID?: string };

export default function setupWebsockets(httpServer: HTTPServer) {
  function updateHost(sessionID: string) {
    const { host, sockets } = getSession(sessionID);
    if (!host) return;
    const hostSocket = sockets[host];
    hostSocket.emit("update");
  }

  const socketServer = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  socketServer.on("connection", (socket: SocketWithSessionID) => {
    socket.on("hostHello", (sessionID: string) => {
      socket.sessionID = sessionID;
      socket.join(sessionID);
      const session = getSession(sessionID);
      session.host = socket.id;
      session.sockets[socket.id] = socket;
    });

    socket.on("clientHello", (sessionID: string) => {
      socket.sessionID = sessionID;
      socket.join(sessionID);
      const session = getSession(sessionID);
      session.sockets[socket.id] = socket;
      socket.emit("fileUpdate", {
        files: session.files,
      });
    });

    socket.on("gotFiles", (files) => {
      if (!socket.sessionID) return;
      console.log(`${socket.id} loaded files ${files}`);
      updateHost(socket.sessionID);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.sessionID);
    });
  });

  return socketServer;
}
