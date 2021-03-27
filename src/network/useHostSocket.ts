import { useCallback, useEffect, useRef, useState } from "react";
import { EventData, InitialLoadPayload, useSocket } from "./useSockets";
import Socket = SocketIOClient.Socket;

type OnInitialLoad = (event: { payload: InitialLoadPayload }) => void;

type SyncMessage = {
  numClients: number;
  filesSynced: boolean;
};

function useSyncState() {
  const [synced, setSynced] = useState(false);
  const setSyncing = useCallback(() => {
    setSynced(false);
  }, []);
  return [synced, setSynced, setSyncing] as const;
}

function useSync(socket: Socket) {
  const [synced, setSynced, setSyncing] = useSyncState();
  const [numberClients, setNumberClients] = useState(0);
  useEffect(() => {
    // Send host hello on every connection and reconnection.
    socket.on("connect", () => {
      socket.emit("HI_IM_THE_HOST");
    });

    // Log out sync messages.
    socket.on("SYNC", (msg: SyncMessage) => {
      setSynced(msg.filesSynced);
      setNumberClients(msg.numClients);
    });
  }, [setNumberClients, setSynced, socket]);

  return [synced, setSyncing, numberClients] as const;
}

function useSocketLoad(socket: Socket, onInitialLoad: OnInitialLoad) {
  const onInitialLoadRef = useRef<OnInitialLoad>();
  onInitialLoadRef.current = onInitialLoad;
  useEffect(() => {
    // If we have a function to call on initial loading of data, call it.
    socket.on("INITIAL_LOAD", (event: { payload: InitialLoadPayload }) => {
      onInitialLoadRef.current?.(event);
    });
  }, [socket]);
}

function useBroadcastEvent(socket: Socket) {
  return useCallback(
    (event: EventData & { type: string }) => {
      socket.emit(event.type, event);
    },
    [socket]
  );
}

export default function useHostSocket(onInitialLoad: OnInitialLoad) {
  const socket = useSocket();
  const [synced, setSyncing, numberClients] = useSync(socket);
  useSocketLoad(socket, onInitialLoad);
  const broadcastEvent = useBroadcastEvent(socket);

  return { broadcastEvent, synced, numberClients, setSyncing };
}
