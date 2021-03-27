import { useAudioContext } from "../../../audio/AudioContextProvider";
import React, { useEffect } from "react";
import {EventData, InitialLoadPayload, LoadPayload, PlayPayload, useWebsocketEvents} from "../../../network/api";
import { useBuffers } from "../../../audio/useBuffers";
import ScreenCenter from "../../atoms/ScreenCenter";
import Visualizer from "../../molecules/Visualizer/Visualizer";


function useNetworkSound() {
  const { context, unlock, running } = useAudioContext() || {};
  const { playBuffer, loadBuffer, getVisualizerData } = useBuffers("guest");
  const { subscribe, unsubscribe } = useWebsocketEvents();

  useEffect(() => {
    const subscription = subscribe(async ([eventName, event]: [string, EventData]) => {
      console.log(eventName, event, subscription);
      switch (eventName) {
        case "LOAD": {
          const { soundID, encodedData } = event.payload as LoadPayload;
          return loadBuffer(soundID, encodedData);
        }
        case "PLAY": {
          const { soundID } = event.payload as PlayPayload;
          return playBuffer(soundID);
        }
        case "INITIAL_LOAD": {
          const { files } = event.payload as InitialLoadPayload;
          const loadFiles = Object.entries(files).map(([id, data]) =>
            loadBuffer(id, data)
          );
          return Promise.all(loadFiles);
        }
        default:
          return;
      }
    });
    return () => unsubscribe(subscription);
  }, [context, loadBuffer, playBuffer, subscribe, unsubscribe]);

  return { unlock, running, getVisualizerData };
}

export default function GuestUI() {
  const { unlock, running, getVisualizerData } = useNetworkSound();
  return (
    <>
      <ScreenCenter>
        {!running && (
          <button onClick={() => unlock?.()}>Click me to unlock audio</button>
        )}
        {running && <Visualizer getData={getVisualizerData} />}
      </ScreenCenter>
    </>
  );
}
