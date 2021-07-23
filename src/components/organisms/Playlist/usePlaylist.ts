import { useCallback, useState } from "react";
import { BufferLoadedInfo } from "../../../audio/useBuffers";
import useStateWithCallback from "../../../state/useStateWithCallback";
import { ISong } from "../../molecules/Song";
import { PlaylistProps } from "./Playlist";

export type PlaylistAudio = {
  playBuffer(songID: string): Promise<void>;
  stopBuffer(songID: string): void;
  loadBufferFromFile(song: File, soundID: string): Promise<BufferLoadedInfo>;
  onCompleted(songID: string): Promise<unknown>;
};

export default function usePlaylist(
  audio: PlaylistAudio,
  uploadFile: (file: File) => Promise<string>
): PlaylistProps {
  const [playingID, setPlayingID, getPlayingID] = useStateWithCallback<
    string | null
  >(null);
  const [loading, setLoading] = useState(0);
  const [songs, setSongs, getSongs] = useStateWithCallback<ISong[]>([]);

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
        songID: soundID,
        name: fileName.split(".")[0],
      })),
    ]);
    setLoading((loading) => loading - songs.length);
  }

  function deleteSong(index: number) {
    if (playingID === songs[index].songID) {
      audio.stopBuffer(songs[index].songID);
      console.log("stop", songs[index].songID);
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
      const thisSongIndex = playlist.findIndex(
        (track) => track.songID === currentlyPlaying
      );

      // If it's the end, don't queue another song.
      if (thisSongIndex >= playlist.length - 1) {
        setPlayingID(null);
      } else {
        setTimeout(() => {
          playSong(playlist[thisSongIndex + 1].songID);
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
  };
}
