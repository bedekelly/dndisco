import React, { createContext, useContext, useRef, useState } from "react";
import unlock from "./unlockAudioContext";

type AudioContextInfo = {
  unlock: () => void,
  context: AudioContext,
  running: boolean,
  buffers: {
    [id: string]: AudioBuffer
  }
}

const AudioContextContext = createContext<AudioContextInfo>(null!);

declare global {
  interface window {
    webkitAudioContext: typeof AudioContext
  }
}

export default function AudioContextProvider({ children }: { children : React.ReactNode}) {
  const audioContext = useRef<AudioContext>(
    // @ts-ignore: TypeScript doesn't know about Safari :/
    new (window.AudioContext || window.webkitAudioContext)()
  );
  const [running, setRunning] = useState(
    audioContext.current?.state === "running"
  );

  const value = {
    unlock: async () => {
      await unlock(audioContext.current);
      const state = audioContext.current?.state;
      setRunning(state === "running");
    },
    context: audioContext.current,
    running,
    buffers: {},
  };
  // @ts-ignore: adding debug stuff to global window object.
  window.audioContext = audioContext.current;
  return (
    <AudioContextContext.Provider value={value}>
      {children}
    </AudioContextContext.Provider>
  );
}

export function useAudioContext() {
  return useContext<AudioContextInfo>(AudioContextContext);
}
