import {useEffect, useRef} from "react";
import socketIO from "socket.io-client";
import useSubject from "../events/useSubject";
type Socket = SocketIOClient.Socket;


export const SOCKET_SERVER_URL = "https://7bb54f14a162.ngrok.io";


export type LoadPayload = {
  soundID: string,
  encodedData: ArrayBuffer
}

export type PlayPayload = {
  soundID: string,
}

export type InitialLoadPayload = {
  files: {
    [id: string]: ArrayBuffer
  }
}

export type EventData = {
  payload: LoadPayload | PlayPayload | InitialLoadPayload;
}

interface SocketWithOnAny extends Socket {
  onAny(listener: ((event: any) => void)): void;
}

export function useBroadcastEvent() {
  const socketRef = useRef<Socket>();

  useEffect(() => {
    socketRef.current = socketIO(SOCKET_SERVER_URL);
  }, []);

  return (event: EventData & { type: string }) => {
    socketRef.current?.emit(event.type, event);
  };
}

export function useWebsocketEvents(): any {
  const socketRef = useRef<SocketWithOnAny>();
  const {send, subscribe, unsubscribe} = useSubject();

  useEffect(() => {
    // Genuinely horrible TS, but we need to assert that the Socket has an `onAny` method.
    socketRef.current = (socketIO(SOCKET_SERVER_URL) as unknown) as SocketWithOnAny;
    socketRef.current.onAny((event: EventData, ...args: any[]) => send([event, ...args]));
  }, [send]);

  return {subscribe, unsubscribe};
}
