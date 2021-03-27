import { useAudioContext } from "../audio/AudioContextProvider";
import { loadInitialBuffers, useBuffers } from "../audio/useBuffers";
import {
  EventData,
  InitialLoadPayload,
  LoadPayload,
  PlayPayload,
  useClientSocket,
} from "./useSockets";
import { useEffect } from "react";

export default function useNetworkSound() {
  const { context, unlock, running } = useAudioContext() || {};
  const {
    playBuffer,
    loadBuffer,
    stopBuffer,
    getLoadedSounds,
    getVisualizerData,
    stopAll,
  } = useBuffers("guest");
  const { subscribe, unsubscribe, sendMessage } = useClientSocket();

  useEffect(() => {
    const subscription = subscribe(
      async ([eventName, event]: [string, EventData]) => {
        console.log("Event:", eventName, event);
        switch (eventName) {
          case "LOAD": {
            const { soundID, encodedData } = event.payload as LoadPayload;
            await loadBuffer(soundID, encodedData);
            return sendMessage("LOADED_FILES", [...getLoadedSounds(), soundID]);
          }
          case "PLAY": {
            const { soundID } = event.payload as PlayPayload;
            return playBuffer(soundID);
          }
          case "STOP": {
            const { soundID } = event.payload as PlayPayload;
            return stopBuffer(soundID);
          }
          case "STOP_ALL": {
            return stopAll();
          }
          case "INITIAL_LOAD": {
            await loadInitialBuffers(event, loadBuffer);
            const { files } = event.payload as InitialLoadPayload;
            const soundIDs = Object.keys(files);
            return sendMessage("LOADED_FILES", [
              ...getLoadedSounds(),
              ...soundIDs,
            ]);
          }
        }
      }
    );
    return () => unsubscribe(subscription);
  }, [
    context,
    getLoadedSounds,
    loadBuffer,
    playBuffer,
    sendMessage,
    stopAll,
    stopBuffer,
    subscribe,
    unsubscribe,
  ]);

  return { unlock, running, getVisualizerData };
}
