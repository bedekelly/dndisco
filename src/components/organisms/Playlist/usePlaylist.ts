import { useCallback, useEffect, useState } from "react";
import { BufferLoadedInfo } from "../../../audio/useBuffers";
import globalSocket from "../../../network/globalSocket";
import useStateWithCallback from "../../../state/useStateWithCallback";
import { ISong } from "../../molecules/Song";
import { PlaylistProps } from "./Playlist";

export type PlaylistAudio = {
  playBuffer(songID: string): Promise<void>;
  stopBuffer(songID: string): void;
  loadBufferFromFile(song: File, soundID: string): Promise<BufferLoadedInfo>;
  onCompleted(songID: string): Promise<unknown>;
};

type SoundID = string;

export type PlaylistEntry = {
  name: string;
  soundID: string;
};

export type Playlist = {
  currentlyPlaying: null | {
    soundID: SoundID;
    playedAt: number;
  };
  entries: PlaylistEntry[];
  name: string;
};

const noEntries: PlaylistEntry[] = [];

function useNetworkPlaylist(playlistID: string) {
  const [
    playlist,
    setPlaylist,
    getPlaylist,
  ] = useStateWithCallback<null | Playlist>(null);

  const setPlaylistName = useCallback(
    (newName: string) => {
      setPlaylist((oldPlaylist: Playlist | null) => {
        if (!oldPlaylist) return oldPlaylist;
        const newPlaylist = { ...oldPlaylist, name: newName };
        globalSocket.emit("updatePlaylist", playlistID, newPlaylist);
        return newPlaylist;
      });
    },
    [playlistID, setPlaylist]
  );

  const setSongs = useCallback(
    (getNewEntries: (oldEntries: PlaylistEntry[]) => PlaylistEntry[]) => {
      setPlaylist((oldPlaylist: Playlist | null) => {
        if (!oldPlaylist) return oldPlaylist;
        const newPlaylist = {
          ...oldPlaylist,
          entries: getNewEntries(oldPlaylist.entries),
        };
        globalSocket.emit("updatePlaylist", playlistID, newPlaylist);
        return newPlaylist;
      });
    },
    [playlistID, setPlaylist]
  );

  const getSongs = useCallback(async () => {
    return (await getPlaylist())?.entries;
  }, [getPlaylist]);

  useEffect(() => {
    globalSocket.emit("getPlaylist", playlistID, (playlist: Playlist) => {
      setPlaylist(playlist);
    });
  }, [playlistID, setPlaylist]);

  return {
    playlistName: playlist?.name,
    setPlaylistName,
    songs: playlist?.entries || noEntries,
    setSongs: setSongs,
    getSongs,
  };
}

export default function usePlaylist(
  audio: PlaylistAudio,
  playlistID: string,
  uploadFile: (file: File) => Promise<string>
): PlaylistProps {
  const [playingID, setPlayingID, getPlayingID] = useStateWithCallback<
    string | null
  >(null);
  const {
    playlistName,
    setPlaylistName,
    songs,
    setSongs,
    getSongs,
  } = useNetworkPlaylist(playlistID);
  const [loading, setLoading] = useState(0);

  async function appendFiles(songs: File[]) {
    setLoading((loading) => loading + songs.length);
    const namesAndIDsAfterUpload = await Promise.all(
      songs.map(async (song) => {
        const soundID = await uploadFile(song);
        return audio.loadBufferFromFile(song, soundID);
      })
    );

    setSongs((oldSongs) => [
      ...oldSongs,
      ...namesAndIDsAfterUpload.map(({ fileName, soundID }) => ({
        soundID,
        name: fileName.split(".")[0],
      })),
    ]);
    setLoading((loading) => loading - songs.length);
  }

  function deleteSong(index: number) {
    if (playingID === songs[index].soundID) {
      audio.stopBuffer(songs[index].soundID);
      console.log("stop", songs[index].soundID);
      setPlayingID(null);
    }
    setSongs((oldSongs) => {
      const newSongs = [...oldSongs];
      newSongs.splice(index, 1);
      return newSongs;
    });
  }

  async function playSong(songID: string) {
    console.log("play", songID);
    if (playingID) {
      stopSong(playingID);
    }
    setPlayingID(songID);
    await audio.playBuffer(songID);

    audio.onCompleted(songID).then(async () => {
      const currentlyPlaying = await getPlayingID();
      console.log({ currentlyPlaying, songID });

      // Check if song was manually stopped or another track was chosen.
      if (currentlyPlaying !== songID) return;

      // Here, we know that the track has finished organically.
      const playlist = await getSongs();
      const thisSongIndex = playlist?.findIndex(
        (track) => track.soundID === currentlyPlaying
      );

      // If it's the end, don't queue another song.
      if (!playlist || !thisSongIndex || thisSongIndex >= playlist.length - 1) {
        setPlayingID(null);
      } else {
        setTimeout(() => {
          playSong(playlist[thisSongIndex + 1].soundID);
        }, 0);
      }
    });
  }

  const stopSong = useCallback(
    function stopSong(songID: string) {
      console.log("stop", songID);
      setPlayingID(null);
      audio.stopBuffer(songID);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setPlayingID]
  );

  const stopPlaylist = useCallback(
    async function stopPlaylist() {
      const currentlyPlaying = await getPlayingID();
      if (currentlyPlaying) stopSong(currentlyPlaying);
    },
    [getPlayingID, stopSong]
  );

  return {
    stopSong,
    stopPlaylist,
    playingID,
    songs,
    setSongs,
    playSong,
    deleteSong,
    appendFiles,
    loading: !!loading,
    playlistName: playlistName || "",
    setPlaylistName,
  };
}
