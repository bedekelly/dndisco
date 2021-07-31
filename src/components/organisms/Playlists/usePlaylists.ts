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

  useEffect(() => {
    loadingCount.current = 0;
    return () => {
      loadingCount.current = 0;
    };
  }, []);

  return { count: loadingCount.current, push, pop };
}

/**
 * Loads the list of playlist IDs from the server.
 * Returns a callback to create a new playlist.
 */
export default function usePlaylists() {
  const { count, push, pop } = useLoadingCounter();
  const [playlists, setPlaylists] = useState<PlaylistID[]>([]);

  useEffect(() => {
    push();
    globalSocket.emit("getPlaylists", (playlists: PlaylistID[]) => {
      pop();
      return setPlaylists(playlists);
    });
  }, [pop, push]);

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

  return { playlists, createPlaylist, loading: count !== 0 };
}
