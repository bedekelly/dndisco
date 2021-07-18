import React, { useState } from "react";

import UnlockAudio from "../../../audio/UnlockAudio";
import { useBuffers } from "../../../audio/useBuffers";
import useSubscribe from "../../../useSubscribe";
import useUpload from "../../../useUpload";
import ScreenCenter from "../../atoms/ScreenCenter";
import Playlist from "../../molecules/Playlist/Playlist";
// import UploadPad from "../../molecules/UploadPad/UploadPad";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import { apiURL } from "../../pages/CreateSession";
import usePads from "../Pads/usePads";
import useHostSocket from "./useHostSocket";
import VolumeSlider from "../../molecules/VolumeSlider/VolumeSlider";

type HostUIProps = {
  params: {
    sessionID: string;
  };
};

type LoadSounds = {
  getLoadedSounds: () => string[];
  loadBuffer: (
    soundID: string,
    soundBuffer: ArrayBuffer
  ) => Promise<AudioBuffer | undefined>;
};

function useLoadSounds(
  audio: LoadSounds
): (soundIDs: string[]) => Promise<AudioBuffer | undefined>[] {
  return (soundIDs: string[]) => {
    const allLoadedSounds = new Set(audio.getLoadedSounds());
    const missingSounds = soundIDs.filter(
      (soundID) => !allLoadedSounds.has(soundID)
    );
    const loadingEverything = missingSounds.map((soundID) =>
      fetch(`${apiURL}/files/${soundID}`)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audio.loadBuffer(soundID, arrayBuffer))
    );
    return loadingEverything;
  };
}

export default function HostUI({ params: { sessionID } }: HostUIProps) {
  const audio = useBuffers("host");
  const loadSounds = useLoadSounds(audio);
  const uploadFile = useUpload(sessionID);
  const { pads, playPad, stopPad, onLoadFile, onServerFiles } = usePads(
    audio,
    uploadFile,
    loadSounds
  );

  const { serverFiles$ } = useHostSocket(sessionID);
  useSubscribe(serverFiles$, onServerFiles);

  // Todo: remove playlist testing code
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [loading, setLoading] = useState(0);
  const [songs, setSongs] = useState<ISong[]>([
    // { name: "Rose Rouge — St Germain", songID: "1" },
    // { name: "Unsquare Dance — Dave Brubeck", songID: "2" },
    // { name: "Take Five — Dave Brubeck", songID: "3" },
    // { name: "Sinnerman — Nina Simone", songID: "4" },
    // { name: "That's All — The Phil Collins Big Band", songID: "5" },
    // { name: "Black Man in a White World — Michael Kiwanuka", songID: "6" },
    // { name: "Blue Rondo a la Turk — Dave Brubeck", songID: "7" },
  ]);

  async function appendSongs(songs: File[]) {
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
    if (playingSong === songs[index].songID) {
      audio.stopBuffer(songs[index].songID);
      setPlayingSong(null);
    }
    setSongs((oldSongs) => {
      const newSongs = [...oldSongs];
      newSongs.splice(index, 1);
      return newSongs;
    });
  }

  function playSong(songID: string) {
    console.log("play", songID);
    if (playingSong) {
      stopSong(playingSong);
    }
    setPlayingSong(songID);
    audio.playBuffer(songID);
  }
  function stopSong(songID: string) {
    console.log("stop", songID);
    audio.stopBuffer(songID);
    setPlayingSong(null);
  }

  function playAll() {
    audio.playBuffer(songs[0].songID);
  }

  return (
    <UnlockAudio>
      <ScreenCenter>
        <div>
          <Visualizer getData={audio.getVisualizerData} />
          <VolumeSlider
            value={audio.volume}
            setValue={(vol) => audio.setVolume(vol)}
          ></VolumeSlider>
        </div>
        {/* {pads.map((pad, i) => (
          <UploadPad
            key={i}
            play={() => playPad(i)}
            stop={() => stopPad(i)}
            onLoadFile={(file) => onLoadFile(i, file)}
            fileName={pad.filename}
            loading={pad.loading}
          />
        ))} */}
        <Playlist
          deleteSong={deleteSong}
          playingID={playingSong}
          appendFiles={appendSongs}
          songs={songs}
          playSong={playSong}
          stopSong={stopSong}
          playAll={playAll}
          loading={!!loading}
        />
      </ScreenCenter>
    </UnlockAudio>
  );
}
