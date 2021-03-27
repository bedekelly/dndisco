import {useCallback, useEffect, useRef, useState} from "react";
import socketIO from "socket.io-client";
import useSubject from "../events/useSubject";
type Socket = SocketIOClient.Socket;


export const SOCKET_SERVER_URL = "https://7793d50af454.ngrok.io";


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
  payload?: LoadPayload | PlayPayload | InitialLoadPayload;
}

interface SocketWithOnAny extends Socket {
  onAny(listener: ((event: any) => void)): void;
}

type SyncMessage = {
  numClients: number;
  filesSynced: boolean;
}

type OnInitialLoad = (event: { payload: InitialLoadPayload }) => void;

export function useHostSocket(onInitialLoad: OnInitialLoad) {
  const socketRef = useRef<SocketWithOnAny>();
  const [synced, setSynced] = useState(false);
  const [numberClients, setNumberClients] = useState(0);
  const onInitialLoadRef = useRef<OnInitialLoad>();
  onInitialLoadRef.current = onInitialLoad;

  const setDirty = useCallback(() => {
    setSynced(false);
  }, []);

  useEffect(() => {
    socketRef.current = socketIO(SOCKET_SERVER_URL) as unknown as SocketWithOnAny;

    // Send host hello on every connection and reconnection.
    socketRef.current.on("connect", () => {
          socketRef.current?.emit('HI_IM_THE_HOST');
    });

    // Log out sync messages.
    socketRef.current.on('SYNC', (msg: SyncMessage) => {
      setSynced(msg.filesSynced);
      setNumberClients(msg.numClients);
    });

    socketRef.current.on('INITIAL_LOAD', (event: { payload: InitialLoadPayload }) => {
      onInitialLoadRef.current?.(event);
    });

    // socketRef.current.onAny(event => {
    //   // console.log(event);
    // })

    return () => {
      socketRef.current?.close();
    }
  }, []);

  const broadcastEvent = useCallback((event: EventData & { type: string }) => {
    socketRef.current?.emit(event.type, event);
  }, []);

  return { broadcastEvent, synced, numberClients, setDirty };
}

export function useClientSocket() {
  const socketRef = useRef<SocketWithOnAny>();
  const {send, subscribe, unsubscribe} = useSubject();

  useEffect(() => {
    // Genuinely horrible TS, but we need to assert that the Socket has an `onAny` method.
    socketRef.current = (socketIO(SOCKET_SERVER_URL) as unknown) as SocketWithOnAny;
    socketRef.current.onAny((event: EventData, ...args: any[]) => send([event, ...args]));

    return () => {
      socketRef.current?.close();
    }
  }, [send]);

  const sendMessage = useCallback((name, message) => {
    socketRef.current?.emit(name, message);
  }, []);

  return {subscribe, unsubscribe, sendMessage};
}
