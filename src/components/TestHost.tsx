import socketIO from "socket.io-client";
export const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL?.replaceAll('"', "") || "";

export const globalSocket = socketIO(SOCKET_SERVER_URL);

globalSocket.send("hostHello", "sessionID123");

export default function TestHost() {
  return <h1>Testing</h1>;
}
