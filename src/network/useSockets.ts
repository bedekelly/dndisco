import { useEffect, useRef } from "react";
import socketIO from "socket.io-client";

type Socket = SocketIOClient.Socket;

export const SOCKET_SERVER_URL = "https://7793d50af454.ngrok.io";

export type LoadPayload = {
  soundID: string;
  encodedData: ArrayBuffer;
};

export type PlayPayload = {
  soundID: string;
};

export type InitialLoadPayload = {
  files: {
    [id: string]: ArrayBuffer;
  };
};

export type EventData = {
  payload?: LoadPayload | PlayPayload | InitialLoadPayload;
};

interface SocketWithOnAny extends Socket {
  onAny(listener: (event: any) => void): void;
}

export function useSocket() {
  const socketRef = useRef(
    (socketIO(SOCKET_SERVER_URL) as unknown) as SocketWithOnAny
  );

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      socket.close();
    };
  }, []);
  return socketRef.current;
}
