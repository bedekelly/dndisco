import { useState } from "react";
import { BufferLoadedInfo } from "../../../audio/useBuffers";
import { ISong } from "../../molecules/Song";
import { PlaylistProps } from "./Playlist";

type PlaylistAudio = {
  playBuffer(songID: string): Promise<void>;
  stopBuffer(songID: string): void;
  loadBufferFromFile(song: File, soundID: string): Promise<BufferLoadedInfo>;
  onCompleted(songID: string): Promise<unknown>;
};

export default function usePlaylist(
  audio: PlaylistAudio,
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

  async function playSong(songID: string) {
    console.log("play", songID);
    if (playingID) {
      stopSong(playingID);
    }
    setPlayingID(songID);
    await audio.playBuffer(songID);

    audio.onCompleted(songID).then(() => {
      setPlayingID((playingID) => (playingID === songID ? null : playingID));
    });
  }

  function stopSong(songID: string) {
    console.log("stop", songID);
    audio.stopBuffer(songID);
    setPlayingID(null);
  }

  return {
    stopSong,
    playingID,
    songs,
    playSong,
    deleteSong,
    appendFiles,
    loading: !!loading,
  };
}
