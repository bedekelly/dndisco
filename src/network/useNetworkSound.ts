import { useCallback, useEffect, useRef, useState } from "react";
import onFilesUpdate from "../audio/onFilesUpdate";
import { AudioControls } from "../audio/useBuffers";
import globalSocket from "./globalSocket";

type PlaylistID = string;
type NetworkState = "loaded" | "loading" | "disconnected";

function useGuestPlaylists(audio: AudioControls) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [playlists, setPlaylists] = useState<PlaylistID[]>([]);

  /**
   * Loads the list of playlist IDs from the server.
   */
  const loadPlaylists = useCallback(() => {
    setLoadingCount((count) => count + 1);

    globalSocket.emit("getPlaylists", (playlists: PlaylistID[]) => {
      setLoadingCount((count) => count - 1);
      return setPlaylists(playlists);
    });
  }, []);

  return { playlists, loadPlaylists, loading: loadingCount !== 0 };
}

export default function useNetworkSound(
  audio: AudioControls,
  sessionID: string
) {
  const firstLoad = useRef(true);
  const [networkState, setNetworkState] = useState<NetworkState>(
    "disconnected"
  );

  const { loadPlaylists } = useGuestPlaylists(audio);

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
          loadPlaylists();
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
