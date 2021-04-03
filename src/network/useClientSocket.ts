import useSubject from "../events/useSubject";
import { useCallback, useEffect, useState } from "react";
import { EventData, useSocket } from "./useSockets";
import { Socket } from "socket.io-client";

function useBroadcastMessage(socket: typeof Socket) {
  return useCallback(
    (name, message) => {
      socket.emit(name, message);
    },
    [socket]
  );
}

export default function useClientSocket() {
  const socket = useSocket();
  const [connected, setConnected] = useState(false);
  const { send, subscribe, unsubscribe } = useSubject();
  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
    });
    socket.on("disconnect", () => {
      setConnected(false);
    });
    socket.onAny((event: EventData, ...args: any[]) => {
      setConnected(socket.connected);
      send([event, ...args]);
    });
  }, [send, socket]);
  const sendMessage = useBroadcastMessage(socket);
  return { subscribe, unsubscribe, connected, sendMessage };
}
