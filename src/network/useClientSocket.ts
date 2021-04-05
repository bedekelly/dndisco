import useSubject from "../events/useSubject";
import { useCallback, useEffect, useState } from "react";
import { EventData, globalSocket } from "./useSockets";
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
  const [connected, setConnected] = useState(false);
  const { send, subscribe, unsubscribe } = useSubject();
  useEffect(() => {
    globalSocket.on("connect", () => {
      setConnected(true);
    });
    globalSocket.on("disconnect", () => {
      setConnected(false);
    });
    globalSocket.onAny((event: EventData, ...args: any[]) => {
      setConnected(globalSocket.connected);
      send([event, ...args]);
    });
  }, [send]);
  const sendMessage = useBroadcastMessage(globalSocket);
  return { subscribe, unsubscribe, connected, sendMessage };
}
