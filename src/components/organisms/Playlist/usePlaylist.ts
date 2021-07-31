import { useCallback, useEffect, useState } from "react";
import { AudioControls, BufferLoadedInfo } from "../../../audio/useBuffers";
import globalSocket from "../../../network/globalSocket";
import useLoadSounds from "../../../network/useLoadSounds";
import useStateWithCallback from "../../../state/useStateWithCallback";
import { PlaylistProps } from "./Playlist";

type SoundID = string;

export type PlaylistEntry = {
  name: string;
  soundID: string;
};

export type Playlist = {
  currentlyPlaying: null | {
    soundID: SoundID;
    offset?: number;
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
        const newPlaylist = {
          ...oldPlaylist,
          name: newName,
        };
        globalSocket.emit("updatePlaylist", playlistID, newPlaylist, false);
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
        globalSocket.emit("updatePlaylist", playlistID, newPlaylist, false);
        return newPlaylist;
      });
    },
    [playlistID, setPlaylist]
  );

  const getSongs = useCallback(async () => {
    return (await getPlaylist())?.entries;
  }, [getPlaylist]);

  /** Retrieve data about a playlist when the ID changes. */
  useEffect(() => {
    globalSocket.emit("getPlaylist", playlistID, (playlist: Playlist) => {
      setPlaylist(playlist);
    });
  }, [playlistID, setPlaylist]);

  const getPlaying = useCallback(async () => {
    return (await getPlaylist())?.currentlyPlaying;
  }, [getPlaylist]);

  const setPlayingID = useCallback(
    (soundID: string | null, sendUpdate: boolean = true) => {
      setPlaylist((oldPlaylist: Playlist | null) => {
        if (!oldPlaylist) return oldPlaylist;
        const currentlyPlaying = soundID == null ? null : { soundID };

        const newPlaylist = {
          ...oldPlaylist,
          currentlyPlaying,
        };
        if (sendUpdate)
          globalSocket.emit("updatePlaylist", playlistID, newPlaylist, true);
        return newPlaylist;
      });
    },
    [playlistID, setPlaylist]
  );

  return {
    playlistName: playlist?.name,
    setPlaylistName,
    getPlaylist,
    songs: playlist?.entries || noEntries,
    setSongs: setSongs,
    getSongs,
    getPlaying,
    playingID: playlist?.currentlyPlaying?.soundID || null,
    setPlayingID,
  };
}

export default function usePlaylist(
  audio: AudioControls,
  playlistID: string,
  uploadFile: (file: File) => Promise<string>
): PlaylistProps {
  const {
    playlistName,
    setPlaylistName,
    songs,
    setSongs,
    getSongs,
    getPlaying,
    getPlaylist,
    playingID,
    setPlayingID,
  } = useNetworkPlaylist(playlistID);

  const startPlaying = useCallback(
    async function startPlaying(loadingOffset: number) {
      const start = performance.now();
      const playlist = await getPlaylist();
      if (!playlist || !playlist.currentlyPlaying) return;

      let { offset: serverOffset, soundID } = playlist.currentlyPlaying;
      serverOffset = (serverOffset || 0) / 1000; // Todo: shouldn't ever happen.
      let totalOffset = serverOffset + loadingOffset;
      const currentSongs = await getSongs();
      if (!currentSongs) {
        console.warn("no current songs");
        return;
      }
      let playlistFinished = false;

      while (totalOffset >= audio.durations[soundID]) {
        console.log({
          totalOffset,
          currentIDDuration: audio.durations[soundID],
          soundID,
        });
        totalOffset -= audio.durations[soundID];
        let soundIndex = currentSongs.findIndex(
          // Sure, we're "defining a function inside a loop", but it's invoked immediately.
          // eslint-disable-next-line
          (song) => song.soundID === soundID
        );
        if (!currentSongs[soundIndex + 1]) {
          playlistFinished = true;
          break;
        }
        soundID = currentSongs[soundIndex + 1].soundID;
      }

      console.log({
        totalOffset,
        currentIDDuration: audio.durations[soundID],
      });

      if (playlistFinished) return;

      console.log("final soundID:", { soundID });
      const end = performance.now();
      const processingOffset = (end - start) / 1000;
      console.log(totalOffset + processingOffset);

      playSong(soundID, totalOffset + processingOffset, false);
    },
    // Todo: playSong is in the dependency array but it's not hoisted.
    // eslint-disable-next-line
    [audio.durations, getPlaylist, getSongs]
  );

  /**
   * Load all the sounds used in this playlist.
   */
  const [loading, setLoading] = useState(0);
  const loadSounds = useLoadSounds(audio);

  useEffect(() => {
    console.log("loading everything from scratch again");
    const startTime = performance.now();
    setLoading((count) => count + 1);
    loadSounds(songs.map((entry) => entry.soundID))
      .then((loadedSongs) => {
        setLoading((count) => count - 1);
        return loadedSongs.length;
      })
      .then((numberLoadedSongs) => {
        if (numberLoadedSongs > 0)
          startPlaying((performance.now() - startTime) / 1000);
      });
  }, [loadSounds, startPlaying, songs]);

  /**
   * Add an array of files to the playlist.
   */
  async function appendFiles(songs: File[]) {
    setLoading((loading) => loading + songs.length);
    const namesAndIDsAfterUpload = await Promise.all(
      songs.map(async (song) => {
        try {
          const soundID = await uploadFile(song);
          return audio.loadBufferFromFile(song, soundID);
        } catch (e) {
          console.warn(e.target?.error);
          console.warn(e);
          return null;
        }
      })
    );

    setSongs((oldSongs) => [
      ...oldSongs,
      ...namesAndIDsAfterUpload
        .filter((x): x is BufferLoadedInfo => x != null)
        .map(({ fileName, soundID }) => ({
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

  const playSong = useCallback(
    async function playSong(
      songID: string,
      offset: number = 0,
      sendUpdate: boolean = true
    ) {
      if (playingID) {
        stopSong(playingID);
      }
      setPlayingID(songID, sendUpdate);
      await audio.playBufferAtOffset(songID, offset);

      audio.onCompleted(songID).then(async () => {
        const currentlyPlaying = (await getPlaying())?.soundID;

        // Check if song was manually stopped or another track was chosen.
        if (currentlyPlaying !== songID) return;

        // Here, we know that the track has finished organically.
        const playlist = await getSongs();
        const thisSongIndex = playlist?.findIndex(
          (track) => track.soundID === currentlyPlaying
        );

        if (
          !playlist || // Playlist doesn't exist (somehow?)
          thisSongIndex == null || // Can't find this song any more (somehow?)
          thisSongIndex >= playlist.length - 1 // Song is at the end of the playlist.
        ) {
          setPlayingID(null);
        } else {
          setTimeout(() => {
            const nextSong = playlist[thisSongIndex + 1].soundID;
            playSong(nextSong, 0, true);
          }, 0);
        }
      });
    },
    // Todo: stopSong needs to be in the deps array but it isn't hoisted.
    // eslint-disable-next-line
    [audio, getPlaying, getSongs, playingID, setPlayingID]
  );

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
      const currentlyPlaying = (await getPlaying())?.soundID;
      if (currentlyPlaying) stopSong(currentlyPlaying);
    },
    [getPlaying, stopSong]
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
