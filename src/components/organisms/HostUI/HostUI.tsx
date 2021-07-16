import React, { useState } from "react";

import UnlockAudio from "../../../audio/UnlockAudio";
import { BufferLoadedInfo, useBuffers } from "../../../audio/useBuffers";
import ScreenCenter from "../../atoms/ScreenCenter";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import Visualizer from "../../molecules/Visualizer/Visualizer";
// import Visualizer from "../../molecules/Visualizer/Visualizer";

function makeInitialPads(): Pad[] {
  return Array(2)
    .fill(0)
    .map(() => ({
      filename: null,
      soundID: null,
    }));
}

type EmptyPad = {
  soundID: null;
  filename: null;
};

type PopulatedPad = {
  soundID: string;
  filename: string;
};

type Pad = EmptyPad | PopulatedPad;

type BufferAudio = {
  playBuffer: (soundID: string) => void;
  stopBuffer: (soundID: string) => void;
  loadBufferFromFile: (soundFile: File) => Promise<BufferLoadedInfo>;
};

function usePads(audio: BufferAudio) {
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
    const { soundID } = await audio.loadBufferFromFile(file);
    console.log({ soundID });
    setPads((oldPads) => {
      const newPads = [...oldPads];
      newPads[padIndex] = { filename: file.name, soundID };
      return newPads;
    });
  }

  return { pads, playPad, stopPad, onLoadFile };
}

export default function HostUI() {
  const audio = useBuffers("host");
  const { pads, playPad, stopPad, onLoadFile } = usePads(audio);

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
          />
        ))}
      </ScreenCenter>
    </UnlockAudio>
  );
}
