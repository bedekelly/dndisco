import {useEffect} from "react";

import {useAudioContext} from "../audio/AudioContextProvider";
import {Buffers, loadInitialBuffers, useBuffers} from "../audio/useBuffers";
import {EventData, InitialLoadPayload, LoadPayload, PlayPayload,} from "./useSockets";
import useClientSocket from "./useClientSocket";


function useNetworkSoundEvents(buffers: Omit<Buffers, 'getVisualizerData'>) {
  const {subscribe, unsubscribe, sendMessage} = useClientSocket();
  useEffect(() => {
    const subscription = subscribe(
      async ([eventName, event]: [string, EventData]) => {
        console.log("Event:", eventName, event);
        switch (eventName) {
          case "LOAD": {
            const {soundID, encodedData} = event.payload as LoadPayload;
            await buffers.loadBuffer(soundID, encodedData);
            return sendMessage("LOADED_FILES", [...buffers.getLoadedSounds(), soundID]);
          }
          case "PLAY": {
            const {soundID} = event.payload as PlayPayload;
            return buffers.playBuffer(soundID);
          }
          case "STOP": {
            const {soundID} = event.payload as PlayPayload;
            return buffers.stopBuffer(soundID);
          }
          case "STOP_ALL": {
            return buffers.stopAll();
          }
          case "INITIAL_LOAD": {
            await loadInitialBuffers(event, buffers.loadBuffer);
            const {files} = event.payload as InitialLoadPayload;
            const soundIDs = Object.keys(files);
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
}



export default function useNetworkSound() {
  const {unlock, running} = useAudioContext() || {};
  const {getVisualizerData, ...buffers} = useBuffers("guest");
  useNetworkSoundEvents(buffers);
  return {unlock, running, getVisualizerData};
}
