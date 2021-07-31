import { useState, useEffect } from "react";
import globalSocket from "./globalSocket";

export default function useServerStats() {
  const [isSynced, setIsSynced] = useState(true);
  const [numberClients, setNumberClients] = useState(0);
  useEffect(() => {
    globalSocket.on(
      "isSynced",
      (newIsSynced: boolean, newNumberClients: number) => {
        console.log({ isSynced: newIsSynced, numberClients: newNumberClients });
        setIsSynced(newIsSynced);
        setNumberClients(newNumberClients);
      }
    );
  }, []);

  return { isSynced, numberClients };
}
