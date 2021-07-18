import React from "react";

import UnlockAudio from "../../../audio/UnlockAudio";
import { useBuffers } from "../../../audio/useBuffers";
import useSubscribe from "../../../useSubscribe";
import useUpload from "../../../useUpload";
import ScreenCenter from "../../atoms/ScreenCenter";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import { apiURL } from "../../pages/CreateSession";
import usePads from "../Pads/usePads";
import useHostSocket from "./useHostSocket";

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

  return (
    <UnlockAudio>
      <ScreenCenter>
        <Visualizer getData={audio.getVisualizerData} />
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
      </ScreenCenter>
    </UnlockAudio>
  );
}
