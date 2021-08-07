import { useState, useEffect, useCallback, useRef } from "react";
import globalSocket from "../../../network/globalSocket";

type PlaylistID = string;

function useLoadingCounter() {
  const loadingCount = useRef(0);

  const push = useCallback(() => {
    loadingCount.current = loadingCount.current + 1;
  }, []);
  const pop = useCallback(() => {
    loadingCount.current = loadingCount.current + -1;
  }, []);

  const clear = useCallback(() => {
    loadingCount.current = 0;
  }, []);

  useEffect(() => {
    loadingCount.current = 0;
    return () => {
      loadingCount.current = 0;
    };
  }, []);

  return { count: loadingCount, push, pop, clear };
}

/**
 * Loads the list of playlist IDs from the server.
 * Returns a callback to create a new playlist.
 */
export default function usePlaylists() {
  const { count, push, pop, clear } = useLoadingCounter();
  const [playlists, setPlaylists] = useState<PlaylistID[]>([]);

  useEffect(() => {
    globalSocket.on("playlistsUpdate", (playlists: PlaylistID[]) => {
      return setPlaylists(playlists);
    });

    return () => {
      globalSocket.off("playlistsUpdate");
    };
  }, [clear, pop, push]);

  const createPlaylist = useCallback(() => {
    push();
    return new Promise<PlaylistID>((resolve) => {
      globalSocket.emit("createPlaylist", (playlistID: PlaylistID) => {
        setPlaylists((playlists) => [...playlists, playlistID]);
        pop();
        resolve(playlistID);
      });
    });
  }, [pop, push]);

  return { playlists, createPlaylist, loading: count.current !== 0 };
}
