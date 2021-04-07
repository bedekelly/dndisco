import socketIO from "socket.io-client";

type Socket = SocketIOClient.Socket;

export const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL?.replaceAll('"', "") || "";
console.log({ SOCKET_SERVER_URL });

type SoundID = string;

export type LoadPayload = {
  soundID: SoundID;
  encodedData: ArrayBuffer;
};

export type PlayPayload = {
  soundID: SoundID;
};

export type InitialLoadPayload = {
  files: {
    [id: string]: ArrayBuffer;
  };
};

type Offset = number;
export type InitialPlayPayload = [SoundID, Offset][];

export type EventData = {
  payload?: LoadPayload | PlayPayload | InitialLoadPayload | InitialPlayPayload;
};

interface SocketWithOnAny extends Socket {
  onAny(listener: (event: any) => void): void;
}

export const globalSocket = (socketIO(
  SOCKET_SERVER_URL
) as unknown) as SocketWithOnAny;
