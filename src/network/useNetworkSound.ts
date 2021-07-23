import { useEffect, useRef, useState } from "react";
import onFilesUpdate from "../audio/onFilesUpdate";
import { AudioControls } from "../audio/useBuffers";
import globalSocket from "./globalSocket";

type NetworkState = "loaded" | "loading" | "disconnected";

export default function useNetworkSound(
  audio: AudioControls,
  sessionID: string
) {
  const firstLoad = useRef(true);
  const [networkState, setNetworkState] = useState<NetworkState>(
    "disconnected"
  );

  useEffect(() => {
    globalSocket.connect();

    globalSocket.on(
      "whoAreYou",
      (replyWith: (sessionID: string, role: "host" | "guest") => void) => {
        setNetworkState("loaded");
        replyWith(sessionID, "guest");
      }
    );

    globalSocket.on(
      "filesUpdate",
      (files: string[], playing: Record<string, number>) => {
        setNetworkState("loading");
        onFilesUpdate(audio, files, playing, firstLoad.current).then(() => {
          firstLoad.current = false;
          setNetworkState("loaded");
        });
      }
    );

    globalSocket.on("play", (soundID: string) => {
      audio.playBuffer(soundID);
    });
    globalSocket.on("stop", (soundID: string) => {
      audio.stopBuffer(soundID);
    });
    globalSocket.on("stopAll", () => {
      audio.stopAll();
    });

    globalSocket.on("disconnected", () => {
      setNetworkState("disconnected");
    });

    return () => {
      globalSocket.off("whoAreYou");
      globalSocket.off("filesUpdate");
      globalSocket.off("play");
      globalSocket.off("stop");
      setNetworkState("disconnected");
      globalSocket.close();
    };
    // Todo: can we memoize `audio` somehow?
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionID]);

  return networkState;
}
