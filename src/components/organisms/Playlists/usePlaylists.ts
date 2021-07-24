import { useState, useEffect, useCallback } from "react";
import globalSocket from "../../../network/globalSocket";

type PlaylistID = string;

/**
 * Loads the list of playlist IDs from the server.
 * Returns a callback to create a new playlist.
 */
export default function usePlaylists() {
  const [loadingCount, setLoadingCount] = useState(0);
  const [playlists, setPlaylists] = useState<PlaylistID[]>([]);

  useEffect(() => {
    setLoadingCount((count) => count + 1);
    globalSocket.emit("getPlaylists", (playlists: PlaylistID[]) => {
      setLoadingCount((count) => count - 1);
      return setPlaylists(playlists);
    });
  }, []);

  const createPlaylist = useCallback(() => {
    setLoadingCount((count) => count + 1);
    globalSocket.emit("createPlaylist", (playlistID: PlaylistID) => {
      setPlaylists((playlists) => [...playlists, playlistID]);
      setLoadingCount((count) => count - 1);
    });
  }, []);

  return { playlists, createPlaylist, loading: loadingCount !== 0 };
}
