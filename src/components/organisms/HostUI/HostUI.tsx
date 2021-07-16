import React, { useState } from "react";

import UnlockAudio from "../../../audio/UnlockAudio";
import { BufferLoadedInfo, useBuffers } from "../../../audio/useBuffers";
import ScreenCenter from "../../atoms/ScreenCenter";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import { apiURL } from "../../pages/CreateSession";
// import Visualizer from "../../molecules/Visualizer/Visualizer";

function makeInitialPads(): Pad[] {
  return Array(2)
    .fill(0)
    .map(() => ({
      filename: null,
      soundID: null,
      loading: false,
    }));
}

type EmptyPad = {
  soundID: null;
  filename: null;
  loading: boolean;
};

type PopulatedPad = {
  soundID: string;
  filename: string;
  loading: false;
};

type Pad = EmptyPad | PopulatedPad;

type BufferAudio = {
  playBuffer: (soundID: string) => void;
  stopBuffer: (soundID: string) => void;
  loadBufferFromFile: (
    soundFile: File,
    soundID: string
  ) => Promise<BufferLoadedInfo>;
};

function usePads(
  audio: BufferAudio,
  uploadFile: (file: File) => Promise<string>
) {
  const [pads, setPads] = useState<Pad[]>(makeInitialPads);

  function playPad(i: number) {
    const { soundID } = pads[i];
    if (soundID == null) return;
    audio.playBuffer(soundID);
  }

  function stopPad(i: number) {
    const { soundID } = pads[i];
    if (soundID) audio.stopBuffer(soundID);
  }

  async function onLoadFile(padIndex: number, file: File) {
    // Todo: upload file in parallel.
    console.log({ padIndex, file });
    setPads((oldPads) => {
      const newPads = [...oldPads];
      newPads[padIndex] = { filename: null, soundID: null, loading: true };
      return newPads;
    });
    console.log("set pads done");
    const soundID = await uploadFile(file);
    await audio.loadBufferFromFile(file, soundID);
    setPads((oldPads) => {
      const newPads = [...oldPads];
      newPads[padIndex] = { filename: file.name, soundID, loading: false };
      return newPads;
    });
  }

  return { pads, playPad, stopPad, onLoadFile };
}

type HostUIProps = {
  params: {
    sessionID: string;
  };
};

function useUpload(sessionID: string) {
  return (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${apiURL}/upload-audio/${sessionID}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then(({ soundID }) => soundID);
  };
}

export default function HostUI({ params: { sessionID } }: HostUIProps) {
  const audio = useBuffers("host");
  const uploadFile = useUpload(sessionID);
  const { pads, playPad, stopPad, onLoadFile } = usePads(audio, uploadFile);

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
