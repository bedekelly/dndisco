import { useEffect, useMemo } from "react";
import { Subject } from "rxjs";
import globalSocket from "../../../globalSocket";
import { Message } from "../../../sharedTypes";
import useSubscribe from "../../../useSubscribe";

type ServerFiles = string[];

export default function useHostSocket(
  sessionID: string,
  message$: Subject<Message>
) {
  const serverFiles$ = useMemo(() => new Subject<ServerFiles>(), []);

  useEffect(() => {
    globalSocket.emit("hostHello", sessionID, (files: any) => {
      serverFiles$.next(files);
    });
    return () => {
      globalSocket.close();
    };
  }, [serverFiles$, sessionID]);

  useSubscribe(message$, (message: Message) => {
    switch (message.type) {
      case "play": {
        globalSocket.emit("play", message.soundID);
        break;
      }
      case "stop": {
        globalSocket.emit("stop", message.soundID);
      }
    }
  });

  return { serverFiles$ };
}
