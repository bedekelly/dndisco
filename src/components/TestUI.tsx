import socketIO from "socket.io-client";
export const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL?.replaceAll('"', "") || "";

export const globalSocket = socketIO(SOCKET_SERVER_URL);

globalSocket.send("clientHello", "sessionID123");

globalSocket.on("fileUpdate", (files: string[]) => {
  console.log({ files });
  setTimeout(() => globalSocket.send("gotFiles", ["abc", "def"]), 5000);
});

export default function TestUI() {
  return <h1>Testing</h1>;
}
