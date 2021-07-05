import { useMemo } from "react";
import socketIO from "socket.io-client";
export const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL?.replaceAll('"', "") || "";

export default function TestHost() {
  const hostSocket = useMemo(() => {
    const globalSocket = socketIO(SOCKET_SERVER_URL);
    // globalSocket.emit("hostHello", "sessionID123");
  }, []);
  return <h1>Testing Host</h1>;
}
