import React, { useState } from "react";
import produce from "immer";

import ScreenCenter from "../../atoms/ScreenCenter";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import { useBroadcastEvent } from "../../../network/api";
import { useBuffers } from "../../../audio/useBuffers";

const initialPads = [
  {
    soundID: '',
    fileName: '',
  }
]

export default function HostUI() {
  // const { playPad, filesLoaded, pads } = useSharedSoundState();
  const [pads, setPads] = useState(initialPads);
  const { loadBufferFromFile, playBuffer } = useBuffers("host");
  const broadcastEvent = useBroadcastEvent();

  async function fileLoaded(index: number, soundFile: File) {
    const { encodedData, soundID, fileName } = await loadBufferFromFile(
      soundFile
    );
    console.log("All done!");
    broadcastEvent({ type: "LOAD", payload: { soundID, encodedData } });
    setPads(
      produce(pads, (draft) => {
        draft[index] = { soundID, fileName };
      })
    );
  }

  async function playPad(soundID: string) {
    broadcastEvent({ type: "PLAY", payload: { soundID } });
    return playBuffer(soundID);
  }

  return (
    <ScreenCenter>
      {pads.map((pad, index) => (
        <UploadPad
          play={() => playPad(pad.soundID)}
          fileName={pad.fileName}
          onLoadFile={(file: File) => fileLoaded(index, file)}
        />
      ))}
    </ScreenCenter>
  );
}
