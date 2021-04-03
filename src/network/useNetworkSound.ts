import { useEffect, useState } from "react";

import { useAudioContext } from "../audio/AudioContextProvider";
import { Buffers, loadInitialBuffers, useBuffers } from "../audio/useBuffers";
import {
  EventData,
  InitialLoadPayload,
  LoadPayload,
  PlayPayload,
} from "./useSockets";
import useClientSocket from "./useClientSocket";

function useNetworkSoundEvents(buffers: Omit<Buffers, "getVisualizerData">) {
  const [synced, setSynced] = useState(false);
  const { subscribe, unsubscribe, connected, sendMessage } = useClientSocket();
  useEffect(() => {
    const subscription = subscribe(
      async ([eventName, event]: [string, EventData]) => {
        console.log("Event:", eventName, event);
        switch (eventName) {
          case "PRE_LOAD": {
            setSynced(false);
            return;
          }
          case "LOAD": {
            setSynced(false);
            const { soundID, encodedData } = event.payload as LoadPayload;
            await buffers.loadBuffer(soundID, encodedData);
            setSynced(true);
            return sendMessage("LOADED_FILES", [
              ...buffers.getLoadedSounds(),
              soundID,
            ]);
          }
          case "PLAY": {
            const { soundID } = event.payload as PlayPayload;
            return buffers.playBuffer(soundID);
          }
          case "DELETE": {
            // Todo: can we clean up the buffer?
            const { soundID } = event.payload as PlayPayload;
            return buffers.stopBuffer(soundID);
          }
          case "STOP": {
            const { soundID } = event.payload as PlayPayload;
            return buffers.stopBuffer(soundID);
          }
          case "STOP_ALL": {
            return buffers.stopAll();
          }
          case "INITIAL_LOAD": {
            setSynced(false);
            await loadInitialBuffers(event, buffers.loadBuffer);
            const { files } = event.payload as InitialLoadPayload;
            const soundIDs = Object.keys(files);
            setSynced(true);
            return sendMessage("LOADED_FILES", [
              ...buffers.getLoadedSounds(),
              ...soundIDs,
            ]);
          }
        }
      }
    );
    return () => unsubscribe(subscription);
  }, [buffers, sendMessage, subscribe, unsubscribe]);
  return { synced, connected };
}

export default function useNetworkSound() {
  const { unlock, running } = useAudioContext() || {};
  const { getVisualizerData, ...buffers } = useBuffers("guest");
  const { synced, connected } = useNetworkSoundEvents(buffers);
  return { unlock, synced, connected, running, getVisualizerData };
}
