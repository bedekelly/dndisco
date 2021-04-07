import { useCallback, useEffect, useRef } from "react";
import { EventData, InitialLoadPayload, globalSocket } from "./useSockets";
import { Socket } from "socket.io-client";
import useSync from "./useSync";

type OnInitialLoad = (event: { payload: InitialLoadPayload }) => void;

function useSocketLoad(socket: typeof Socket, onInitialLoad: OnInitialLoad) {
  const onInitialLoadRef = useRef<OnInitialLoad>();
  onInitialLoadRef.current = onInitialLoad;
  useEffect(() => {
    // If we have a function to call on initial loading of data, call it.
    socket.on("INITIAL_LOAD", (event: { payload: InitialLoadPayload }) => {
      onInitialLoadRef.current?.(event);
    });
  }, [socket]);
}

function useBroadcastEvent(socket: typeof Socket) {
  return useCallback(
    (event: EventData & { type: string }) => {
      socket.emit(event.type, event);
    },
    [socket]
  );
}

export default function useHostSocket(onInitialLoad: OnInitialLoad) {
  const [connected, synced, setSyncing, numberClients] = useSync(globalSocket);
  useSocketLoad(globalSocket, onInitialLoad);
  const broadcastEvent = useBroadcastEvent(globalSocket);

  return { broadcastEvent, synced, connected, numberClients, setSyncing };
}