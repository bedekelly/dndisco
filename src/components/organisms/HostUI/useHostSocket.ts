import { now } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";
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
    globalSocket.on(
      "whoAreYou",
      (replyWith: (sessionID: string, role: "host" | "guest") => void) => {
        console.log("hello?");
        replyWith(sessionID, "host");
      }
    );
    return () => {
      globalSocket.off("whoAreYou");
      // globalSocket.close();
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
