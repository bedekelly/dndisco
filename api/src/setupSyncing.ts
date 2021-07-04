import { Server as SocketServer } from "socket.io";

import { getSession } from "./sessions";

export default function setupSyncing(socketServer: SocketServer) {
  /**
   * Send an update on the current state of a session to every client in
   * that session except the host.
   */
  function updateClients(sessionID: string) {
    const { host, files } = getSession(sessionID);
    if (!host) return;
    socketServer.to(sessionID).except(host).emit("file update", files);
  }

  return (sessionID: string) => {
    updateClients(sessionID);
  };
}
