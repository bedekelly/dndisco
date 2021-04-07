import React, { useCallback, useState } from "react";
import produce from "immer";

import ScreenCenter from "../../atoms/ScreenCenter";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import useHostSocket from "../../../network/useHostSocket";
import { loadInitialBuffers, useBuffers } from "../../../audio/useBuffers";
import usePersistentState from "../../../state/usePersistentState";
import NetworkIndicator from "../../atoms/NetworkIndicator";
import StopEverything from "../../atoms/StopEverything";
import { EventData } from "../../../network/useSockets";
import {
  LOAD,
  PLAY,
  DELETE,
  STOP_ALL,
  PRE_LOAD,
  STOP,
} from "../../../network/events";
import Visualizer from "../../molecules/Visualizer/Visualizer";

type Pad = {
  soundID: string;
  fileName: string;
};

const makePad = () =>
  ({
    soundID: "",
    fileName: "",
  } as Pad);
const initialPads: Pad[] = [makePad(), makePad()];

/**
 * For each pad, check if we've still got its buffer.
 * If so, great! If not, clear out that pad.
 */
function updatePadsWithLoadedData(
  pads: Pad[],
  event: any,
  loadedBuffers: string[]
) {
  const sharedFiles = Object.keys(event.payload.files);
  const stillValid = (soundID: string) =>
    !soundID ||
    (loadedBuffers.includes(soundID) && sharedFiles.includes(soundID));
  return pads.map((pad) => (stillValid(pad.soundID) ? pad : makePad()));
}

function useHostUI() {
  const [pads, setPads] = usePersistentState<Pad[]>("pads", initialPads);
  const {
    loadBufferFromFile,
    loadBuffer,
    playBuffer,
    stopAll,
    stopBuffer,
    getVisualizerData,
  } = useBuffers("host");

  /**
   * When we get an INITIAL_LOAD message as the host:
   * 1. Load the buffers from the event.
   * 2. Update the pads so that no outdated files are shown
   *    (this can happen if the server is restarted).
   */
  const onInitialLoad = useCallback(
    async (event: EventData) => {
      const loadedBuffers = await loadInitialBuffers(event, loadBuffer);
      setPads(updatePadsWithLoadedData(pads, event, loadedBuffers));
    },
    [loadBuffer, pads, setPads]
  );

  const server = useHostSocket(onInitialLoad);
  const {
    broadcastEvent,
    synced,
    connected,
    setSyncing,
    numberClients,
  } = server;

  /**
   * When we drag-and-drop a file:
   * 1. Show that we're syncing.
   * 2. Stop the pad's old sound on the host's machine.
   * 3. Broadcast a STOP event for that sound.
   * 4. Load the file into a decoded audio buffer.
   * 5. Broadcast a LOAD event with the encoded data.
   * 6. Display the new filename on the pad.
   */
  const [decoding, setDecoding] = useState(false);
  async function fileLoaded(index: number, soundFile: File) {
    setDecoding(true);
    setSyncing();
    broadcastEvent(PRE_LOAD());
    const oldID = pads[index].soundID;
    if (oldID) {
      stopBuffer(oldID);
      broadcastEvent(DELETE(oldID));
    }
    const loadedBuffer = await loadBufferFromFile(soundFile);
    setDecoding(false);
    const { encodedData, soundID, fileName, duration } = loadedBuffer;
    broadcastEvent(LOAD(soundID, encodedData, duration));
    setPads(
      produce(pads, (draft) => {
        draft[index] = { soundID, fileName };
      })
    );
  }

  async function playPad(soundID: string) {
    if (!synced) return;
    broadcastEvent(PLAY(soundID));
    return playBuffer(soundID);
  }

  async function stopPad(soundID: string) {
    if (!synced) return;
    broadcastEvent(STOP(soundID));
    return stopBuffer(soundID);
  }

  async function stopEverything() {
    broadcastEvent(STOP_ALL());
    return stopAll();
  }

  return {
    pads,
    decoding,
    synced,
    connected,
    numberClients,
    fileLoaded,
    playPad,
    stopPad,
    stopEverything,
    getVisualizerData,
  };
}

export default function HostUI() {
  const {
    pads,
    synced,
    connected,
    decoding,
    numberClients,
    fileLoaded,
    playPad,
    stopPad,
    stopEverything,
    getVisualizerData,
  } = useHostUI();

  return (
    <>
      <NetworkIndicator
        synced={synced}
        decoding={decoding}
        connected={connected}
        numberClients={numberClients}
      />
      <ScreenCenter>
        <Visualizer getData={getVisualizerData} />
        {pads.map((pad, index) => (
          <UploadPad
            key={index}
            play={() => playPad(pad.soundID)}
            stop={() => stopPad(pad.soundID)}
            fileName={pad.fileName}
            onLoadFile={(file: File) => fileLoaded(index, file)}
          />
        ))}
      </ScreenCenter>
      <StopEverything onClick={stopEverything} />
    </>
  );
}
