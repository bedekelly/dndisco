import { useEffect, useMemo, useRef } from "react";
import { Subject } from "rxjs";
import onFilesUpdate from "../../../audio/onFilesUpdate";
import { Audio } from "../../../audio/useBuffers";
import globalSocket from "../../../globalSocket";
import { Message } from "../../../sharedTypes";
import useSubscribe from "../../../useSubscribe";

type ServerFiles = string[];

export default function useHostSocket(
  sessionID: string,
  message$: Subject<Message>,
  audio: Audio
) {
  const serverFiles$ = useMemo(() => new Subject<ServerFiles>(), []);
  const firstLoad = useRef(true);

  useEffect(() => {
    globalSocket.on(
      "whoAreYou",
      (replyWith: (sessionID: string, role: "host" | "guest") => void) => {
        replyWith(sessionID, "host");
      }
    );
    globalSocket.on(
      "filesUpdate",
      (files: string[], playing: Record<string, number>) => {
        onFilesUpdate(audio, files, playing, firstLoad.current);
        firstLoad.current = false;
        serverFiles$.next(files);
      }
    );
    return () => {
      globalSocket.off("whoAreYou");
      globalSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
