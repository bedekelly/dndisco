import React, {useCallback, useEffect, useRef} from "react";
import produce from "immer";

import ScreenCenter from "../../atoms/ScreenCenter";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import { useHostSocket } from "../../../network/useSockets";
import {loadInitialBuffers, useBuffers} from "../../../audio/useBuffers";
import usePersistentState from "../../../state/usePersistentState";
import SyncIndicator from "../../atoms/SyncIndicator";
import StopEverything from "../../atoms/StopEverything";

type Pad = {
  soundID: string,
  fileName: string
}

const makePad = () => ({
  soundID: '',
  fileName: ''
} as Pad);
const initialPads: Pad[] = [makePad()];


export default function HostUI() {
  const [pads, setPads] = usePersistentState<Pad[]>('pads', initialPads);

  const { loadBufferFromFile, loadBuffer, playBuffer, stopAll, stopBuffer } = useBuffers("host");
  const onInitialLoad = useCallback(async (event) => {
    const loadedBuffers = await loadInitialBuffers(event, loadBuffer)
    for (let i = 0; i < pads.length; i++) {
      const sharedFiles = Object.keys(event.payload.files);
      const {soundID} = pads[i];
      if (soundID && (!loadedBuffers.includes(soundID) || !sharedFiles.includes(soundID))) {
        setPads(pads => produce(pads, draft => {
          draft[i] = makePad()
        }));
      }
    }
  }, [loadBuffer, pads, setPads]);
  const { broadcastEvent, synced, setDirty, numberClients } = useHostSocket(onInitialLoad);

  async function fileLoaded(index: number, soundFile: File) {
    setDirty();
    const oldID = pads[index].soundID;
    stopBuffer(oldID);
    broadcastEvent({ type: 'STOP', payload: { soundID: oldID }})
    const { encodedData, soundID, fileName } = await loadBufferFromFile(
      soundFile
    );
    broadcastEvent({ type: "LOAD", payload: { soundID, encodedData } });
    setPads(
      produce(pads, (draft) => {
        draft[index] = { soundID, fileName };
      })
    );
  }

  async function playPad(soundID: string) {
    if (!synced) return;
    broadcastEvent({ type: "PLAY", payload: { soundID } });
    return playBuffer(soundID);
  }

  async function stopEverything() {
    broadcastEvent({ type: 'STOP_ALL' });
    return stopAll();
  }

  return (
    <>
      <SyncIndicator synced={synced} numberClients={numberClients}/>
      <ScreenCenter>
        {pads.map((pad, index) => (
          <UploadPad
            key={index}
            play={() => playPad(pad.soundID)}
            fileName={pad.fileName}
            onLoadFile={(file: File) => fileLoaded(index, file)}
          />
        ))}
      </ScreenCenter>
      <StopEverything onClick={stopEverything} />
    </>
  );
}
