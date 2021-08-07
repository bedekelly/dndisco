import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlaylistAudio, { LoadingTriggers } from "../audio/GuestPlaylistAudio";
import onFilesUpdate from "../audio/onFilesUpdate";
import { AudioControls } from "../audio/useBuffers";
import globalSocket from "./globalSocket";

type PlaylistID = string;
type SoundID = string;
type NetworkState = "loaded" | "loading" | "disconnected";
type PlaylistEntry = {
  soundID: string;
  name: string;
};

type PlaylistData = {
  currentlyPlaying: null | {
    soundID: SoundID;
    offset: number;
  };
  entries: PlaylistEntry[];
  name: string;
};

type Playlists = Record<PlaylistID, PlaylistData>;

/**
 * Create a ref which updates on every change to the input value.
 * This is useful to prevent re-runs of useEffect without disabling eslint
 * rules.
 */
function useAudioRef(audio: AudioControls) {
  const audioRef = useRef(audio);
  useEffect(() => {
    audioRef.current = audio;
  }, [audio]);
  return audioRef;
}

/**
 * Given a set of playlist data in `playlists`, which might continuously change,
 * keep the playing audio up-to-date with what the host is playing.
 */
function usePlaylistsAudio(
  playlists: Playlists,
  unstableAudio: AudioControls,
  loadingCallbacks: LoadingTriggers
) {
  const audio = useAudioRef(unstableAudio);
  const playlistsAudio = useRef<Record<PlaylistID, PlaylistAudio>>({});

  /**
   * Stop playing audio when this is cleaned up.
   */
  useEffect(() => {
    const thisAudio = playlistsAudio.current;
    return function cleanUp() {
      Object.values(thisAudio).forEach((playlistAudio) => playlistAudio.stop());
    };
  }, [audio]);

  /**
   * Update the playlists' audio instances when we get new playlists data.
   */
  useEffect(() => {
    async function updatePlaylistsAudio() {
      for (let [playlistID, playlistData] of Object.entries(playlists)) {
        const currentPlaylistAudio = playlistsAudio.current[playlistID];

        if (currentPlaylistAudio) {
          // Update the existing playlist data.
          currentPlaylistAudio.playlistData = playlistData;
          currentPlaylistAudio.updatePlaylistData(loadingCallbacks);
          return;
        }

        // Create a new PlaylistAudio for every new playlist.
        playlistsAudio.current[playlistID] = new PlaylistAudio(
          audio,
          playlistData,
          loadingCallbacks
        );
      }
    }

    updatePlaylistsAudio();
  }, [audio, loadingCallbacks, playlists]);
}

/**
 * Manage the state of all the playlist IDs. Delegate everything else to
 * `usePlaylistAudio`.
 */
function useGuestPlaylists(
  audio: AudioControls,
  onLoading: CallableFunction,
  onLoaded: CallableFunction
) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [playlists, setPlaylists] = useState<PlaylistID[]>([]);
  const [playlistData, setPlaylistData] = useState<Playlists>({});

  /**
   * This is useful to prevent rerenders.
   */
  const loadingCallbacks = useMemo<LoadingTriggers>(() => {
    const onLoading = () => setLoadingCount((oldCount) => oldCount + 1);
    const onLoaded = () => setLoadingCount((oldCount) => oldCount - 1);
    return [onLoading, onLoaded];
  }, []);

  /**
   * Update parent loading state when our loading count changes.
   */
  useEffect(() => {
    if (loadingCount > 0) {
      onLoading();
    } else {
      onLoaded();
    }
  }, [loadingCount, onLoaded, onLoading]);

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

  /**
   * Whenever the `playlists` list of playlist IDs changes, get data
   * for each playlist.
   */
  useEffect(() => {
    for (let playlist of playlists) {
      globalSocket.emit(
        "getPlaylist",
        playlist,
        (newPlaylistData: PlaylistData) => {
          setPlaylistData((oldPlaylistData) => ({
            ...oldPlaylistData,
            [playlist]: newPlaylistData,
          }));
        }
      );
    }
  }, [playlists]);

  useEffect(() => {
    globalSocket.on(
      "playlistUpdate",
      (playlistID: string, newData: PlaylistData) => {
        setPlaylistData((oldPlaylistData) => ({
          ...oldPlaylistData,
          [playlistID]: newData,
        }));
      }
    );

    return () => {
      globalSocket.off("playlistUpdate");
    };
  }, []);

  /**
   * Delegate to another hook to deal with the actual audio for each of these playlists.
   */
  usePlaylistsAudio(playlistData, audio, loadingCallbacks);

  return { playlists, loadPlaylists, loading: loadingCount !== 0 };
}

/**
 * Listen to the network and play sounds based on what the server sends.
 */
export default function useNetworkSound(
  audio: AudioControls,
  sessionID: string
) {
  const firstLoad = useRef(true);
  const [networkState, setNetworkState] = useState<NetworkState>(
    "disconnected"
  );

  const onLoading = useCallback(() => setNetworkState("loading"), []);
  const onLoaded = useCallback(() => setNetworkState("loaded"), []);

  const { loadPlaylists } = useGuestPlaylists(audio, onLoading, onLoaded);

  /**
   * Attach listeners to the global socket for all the events the server may send.
   */
  useEffect(() => {
    globalSocket.connect();

    globalSocket.on(
      "whoAreYou",
      (replyWith: (sessionID: string, role: "host" | "guest") => void) => {
        replyWith(sessionID, "guest");
      }
    );

    globalSocket.on(
      "filesUpdate",
      (files: string[], playing: Record<string, number>) => {
        console.log({ files });
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
