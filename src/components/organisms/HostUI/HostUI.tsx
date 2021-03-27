import React, { useCallback } from "react";
import produce from "immer";

import ScreenCenter from "../../atoms/ScreenCenter";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import useHostSocket from "../../../network/useHostSocket";
import { loadInitialBuffers, useBuffers } from "../../../audio/useBuffers";
import usePersistentState from "../../../state/usePersistentState";
import SyncIndicator from "../../atoms/SyncIndicator";
import StopEverything from "../../atoms/StopEverything";
import { EventData } from "../../../network/useSockets";
import { LOAD, PLAY, STOP, STOP_ALL } from "../../../network/events";

type Pad = {
  soundID: string;
  fileName: string;
};

const makePad = () =>
  ({
    soundID: "",
    fileName: "",
  } as Pad);
const initialPads: Pad[] = [makePad()];

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
  const { broadcastEvent, synced, setSyncing, numberClients } = server;

  /**
   * When we drag-and-drop a file:
   * 1. Show that we're syncing.
   * 2. Stop the pad's old sound on the host's machine.
   * 3. Broadcast a STOP event for that sound.
   * 4. Load the file into a decoded audio buffer.
   * 5. Broadcast a LOAD event with the encoded data.
   * 6. Display the new filename on the pad.
   */
  async function fileLoaded(index: number, soundFile: File) {
    setSyncing();
    const oldID = pads[index].soundID;
    stopBuffer(oldID);
    broadcastEvent(STOP(oldID));
    const loadedBuffer = await loadBufferFromFile(soundFile);
    const { encodedData, soundID, fileName } = loadedBuffer;
    broadcastEvent(LOAD(soundID, encodedData));
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

  async function stopEverything() {
    broadcastEvent(STOP_ALL());
    return stopAll();
  }

  return { pads, synced, numberClients, fileLoaded, playPad, stopEverything };
}

export default function HostUI() {
  const {
    pads,
    synced,
    numberClients,
    fileLoaded,
    playPad,
    stopEverything,
  } = useHostUI();

  return (
    <>
      <SyncIndicator synced={synced} numberClients={numberClients} />
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
