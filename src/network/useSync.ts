import { useCallback, useEffect, useState } from "react";
import { Socket } from "socket.io-client";

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

export default function useSync(socket: typeof Socket) {
  const [synced, setSynced, setSyncing] = useSyncState();
  const [connected, setConnected] = useState(false);
  const [numberClients, setNumberClients] = useState(0);
  useEffect(() => {
    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Send host hello on every connection and reconnection.
    socket.on("connect", () => {
      console.log("on connect, setting connected to true");
      setConnected(true);
      setSynced(false);
      socket.emit("HI_IM_THE_HOST");
    });

    // Log out sync messages.
    socket.on("SYNC", (msg: SyncMessage) => {
      console.log("on sync");
      setSynced(msg.filesSynced);
      setNumberClients(msg.numClients);
    });
  }, [setNumberClients, setSynced, socket]);

  return [connected, synced, setSyncing, numberClients] as const;
}
