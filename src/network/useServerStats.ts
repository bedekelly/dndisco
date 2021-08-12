import { useState, useEffect } from "react";
import globalSocket from "./globalSocket";

export default function useServerStats() {
  const [isSynced, setIsSynced] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const [numberClients, setNumberClients] = useState(0);

  useEffect(() => {
    globalSocket.on("disconnect", () => {
      setIsConnected(globalSocket.connected);
    });

    globalSocket.on("connect", () => {
      setIsConnected(globalSocket.connected);
    });
    globalSocket.on(
      "isSynced",
      (newIsSynced: boolean, newNumberClients: number) => {
        setIsSynced(newIsSynced);
        setNumberClients(newNumberClients);
      }
    );

    return () => {
      globalSocket.off("isSynced");
      globalSocket.off("connect");
      globalSocket.off("disconnect");
    };
  }, []);

  return { isSynced, isConnected, numberClients };
}
