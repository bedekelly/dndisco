import { useEffect, useMemo } from "react";
import { Subject } from "rxjs";
import globalSocket from "../../../globalSocket";

type ServerFiles = string[];

export default function useHostSocket(sessionID: string) {
  const serverFiles$ = useMemo(() => new Subject<ServerFiles>(), []);

  useEffect(() => {
    globalSocket.emit("hostHello", sessionID, (files: any) => {
      serverFiles$.next(files);
    });
    return () => {
      globalSocket.close();
    };
  }, [serverFiles$, sessionID]);

  return { serverFiles$ };
}
