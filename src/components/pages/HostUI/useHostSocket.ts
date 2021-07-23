import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";
import { Subject } from "rxjs";
import onFilesUpdate from "../../../audio/onFilesUpdate";
import { AudioControls } from "../../../audio/useBuffers";
import globalSocket from "../../../network/globalSocket";
import { Message } from "../../../network/messages";
import useSubscribe from "../../../subscriptions/useSubscribe";
import { Pad } from "../../organisms/Pads/usePads";

type ServerFiles = string[];

export default function useHostSocket(
  sessionID: string,
  message$: Subject<Message>,
  audio: AudioControls,
  pads: Pad[],
  setPads: Dispatch<SetStateAction<Pad[]>>
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
        onFilesUpdate(audio, files, playing, firstLoad.current).then(() => {
          firstLoad.current = false;
          serverFiles$.next(files);
        });
      }
    );
    globalSocket.on("padsUpdate", (pads: Pad[]) => {
      console.log({ pads });
      setPads(pads);
    });
    return () => {
      globalSocket.off("whoAreYou");
      globalSocket.off("filesUpdate");
      globalSocket.off("padsUpdate");
      globalSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverFiles$, sessionID]);

  useEffect(() => {
    globalSocket.emit("padUpdate", pads);
  }, [pads]);

  useSubscribe(message$, (message: Message) => {
    switch (message.type) {
      case "play": {
        globalSocket.emit("play", message.soundID);
        break;
      }
      case "stop": {
        globalSocket.emit("stop", message.soundID);
        break;
      }
      case "stopAll": {
        globalSocket.emit("stopAll");
        break;
      }
      default: {
        console.warn("Unhandled message type:", message);
      }
    }
  });

  return { serverFiles$ };
}
