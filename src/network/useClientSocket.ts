import useSubject from "../events/useSubject";
import { useCallback, useEffect } from "react";
import { EventData, useSocket } from "./useSockets";
import Socket = SocketIOClient.Socket;

function useBroadcastMessage(socket: Socket) {
  return useCallback(
    (name, message) => {
      socket.emit(name, message);
    },
    [socket]
  );
}

export default function useClientSocket() {
  const socket = useSocket();
  const { send, subscribe, unsubscribe } = useSubject();
  useEffect(() => {
    socket.onAny((event: EventData, ...args: any[]) => send([event, ...args]));
  }, [send, socket]);
  const sendMessage = useBroadcastMessage(socket);
  return { subscribe, unsubscribe, sendMessage };
}
