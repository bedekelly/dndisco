import { useState } from "react";
import { ISong } from "../../molecules/Song";
import { PlaylistProps } from "./Playlist";

export default function usePlaylist(
  audio: any,
  uploadFile: (file: File) => Promise<string>
): PlaylistProps {
  const [playingID, setPlayingID] = useState<string | null>(null);
  const [loading, setLoading] = useState(0);
  const [songs, setSongs] = useState<ISong[]>([]);

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
      setPlayingID(null);
    }
    setSongs((oldSongs) => {
      const newSongs = [...oldSongs];
      newSongs.splice(index, 1);
      return newSongs;
    });
  }

  function playSong(songID: string) {
    console.log("play", songID);
    if (playingID) {
      stopSong(playingID);
    }
    setPlayingID(songID);
    audio.playBuffer(songID);
  }

  function stopSong(songID: string) {
    console.log("stop", songID);
    audio.stopBuffer(songID);
    setPlayingID(null);
  }

  function playAll() {
    audio.playBuffer(songs[0].songID);
  }

  return {
    playAll,
    stopSong,
    playingID,
    songs,
    playSong,
    deleteSong,
    appendFiles,
    loading: !!loading,
  };
}
