import React, { useState } from "react";

import UnlockAudio from "../../../audio/UnlockAudio";
import { useBuffers, Audio } from "../../../audio/useBuffers";
import useSubscribe from "../../../useSubscribe";
import useUpload from "../../../useUpload";
import ScreenCenter from "../../atoms/ScreenCenter";
import Playlist, { usePlaylist } from "../Playlist/Playlist";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import { apiURL } from "../../pages/CreateSession";
import usePads, { makePad } from "../Pads/usePads";
import useHostSocket from "./useHostSocket";
import VolumeSlider from "../../molecules/VolumeSlider/VolumeSlider";
import CopyableLink from "../../molecules/CopyableLink";
import { Subject } from "rxjs";
import { Message } from "../../../sharedTypes";
import StopEverything from "../../atoms/StopEverything";

type HostUIProps = {
  params: {
    sessionID: string;
  };
};

function useLoadSounds(
  audio: Audio
): (soundIDs: string[]) => Promise<(AudioBuffer | undefined)[]> {
  return async (soundIDs: string[]) => {
    const allLoadedSounds = new Set(audio.getLoadedSounds());
    const missingSounds = soundIDs.filter(
      (soundID) => !allLoadedSounds.has(soundID)
    );
    const loadingEverything = missingSounds.map((soundID) =>
      fetch(`${apiURL}/files/${soundID}`)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audio.loadBuffer(soundID, arrayBuffer))
    );
    return Promise.all(loadingEverything);
  };
}

function useSubject<T>() {
  const [subject] = useState(() => new Subject<T>());
  return subject;
}

export default function HostUI({ params: { sessionID } }: HostUIProps) {
  const audio = useBuffers("host");
  const loadSounds = useLoadSounds(audio);
  const uploadFile = useUpload(sessionID);

  const messages$ = useSubject<Message>();

  const {
    pads,
    setPads,
    playPad,
    stopPad,
    onLoadFile,
    onServerFiles,
  } = usePads(audio, uploadFile, loadSounds, messages$);

  const { serverFiles$ } = useHostSocket(
    sessionID,
    messages$,
    audio,
    pads,
    setPads
  );
  useSubscribe(serverFiles$, onServerFiles);
  const playlistProps = usePlaylist(audio, uploadFile);

  function stopEverything() {
    messages$.next({ type: "stopAll" });
    audio.stopAll();
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
        {pads.map((pad, i) => (
          <UploadPad
            key={i}
            play={() => playPad(i)}
            stop={() => stopPad(i)}
            onLoadFile={(file) => onLoadFile(i, file)}
            fileName={pad.filename}
            loading={pad.loading}
          />
        ))}
        <button onClick={() => setPads((oldPads) => [...oldPads, makePad()])}>
          + Pad
        </button>
        {/* <Playlist {...playlistProps} /> */}
      </ScreenCenter>
      <CopyableLink sessionID={sessionID} />
      <StopEverything onClick={stopEverything} />
    </UnlockAudio>
  );
}
