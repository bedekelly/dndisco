import { useAudioContext } from "./AudioContextProvider";
import { useCallback, useRef } from "react";
import decodeAudioFile from "./decodeAudioFile";
import useVisualisedDestination from "./useVisualisedDestination";
import getAudioFileDurationMS from "./getAudioFileDuration";

export type BufferLoadedInfo = {
  encodedData: ArrayBuffer;
  soundID: string;
  fileName: string;
  duration: number;
};

// Todo: improve this type!
export type AudioControls = {
  loadBuffer: (
    soundID: string,
    buffer: ArrayBuffer
  ) => Promise<AudioBuffer | undefined>;
  stopBuffer: (soundID: string) => void;
  getVisualizerData: (oldArray?: Uint8Array | undefined) => Uint8Array;
  getLoadedSounds: any;
  loadBufferFromFile: (
    soundFile: File,
    soundID: string
  ) => Promise<BufferLoadedInfo>;
  playBuffer: (soundID: string) => Promise<void>;
  playBufferAtOffset: (soundID: string, offset: number) => Promise<void>;
  stopAll: () => Promise<void>;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  onCompleted: (soundID: string) => Promise<unknown>;
  loadBuffers: any;
  durations: Record<string, number>;
};

export function useBuffers(hostOrGuest: "host" | "guest") {
  const { context, unlock } = useAudioContext();
  const buffers = useRef<Record<string, AudioBuffer>>({});
  const durations = useRef<Record<string, number>>({});
  const bufferSources = useRef<Record<string, AudioBufferSourceNode>>({});
  const {
    destination,
    getVisualizerData,
    volume,
    setVolume,
  } = useVisualisedDestination(hostOrGuest);

  async function loadBufferFromFile(
    soundFile: File,
    soundID: string
  ): Promise<BufferLoadedInfo> {
    const { encodedData, decodedData } = await decodeAudioFile(
      context,
      soundFile
    );
    const fileName = soundFile.name;
    const { duration } = decodedData;
    const oldBuffers = buffers.current;
    durations.current[soundID] = decodedData.duration;
    buffers.current = { ...oldBuffers, [soundID]: decodedData };
    return { encodedData, soundID, fileName, duration };
  }

  const loadBuffer = useCallback(
    async (soundID: string, buffer: ArrayBuffer) => {
      if (!context) {
        console.warn("Couldn't load buffer; context not available.");
        return;
      }
      if (buffer.byteLength === 0) {
        console.warn("Couldn't load buffer; byte length is 0.");
        console.warn({ buffer });
        return;
      }
      console.log("Loading buffer...");
      return context.decodeAudioData(buffer, (decodedData: AudioBuffer) => {
        const oldBuffers = buffers.current;
        durations.current[soundID] = decodedData.duration;
        buffers.current = { ...oldBuffers, [soundID]: decodedData };
        console.log("Loaded.");
      });
    },
    [context]
  );

  function loadBuffers(buffers: Record<string, ArrayBuffer>) {
    return Promise.all(
      Object.entries(buffers).map(([soundID, buffer]) => {
        return loadBuffer(soundID, buffer);
      })
    );
  }

  async function unlockIfNeeded(offset: number) {
    let delayedOffset = offset;
    if (context.state === "suspended") {
      const startTime = performance.now();
      await unlock();
      delayedOffset += (performance.now() - startTime) / 1000;
    }
    return delayedOffset;
  }

  function playBuffer(soundID: string) {
    return playBufferAtOffset(soundID, 0);
  }

  function onCompleted(soundID: string) {
    return new Promise((resolve) => {
      bufferSources.current[soundID].onended = (event) => {
        resolve(event);
      };
    });
  }

  async function playBufferAtOffset(soundID: string, offset: number) {
    if (destination == null) return;
    let delayedOffset = await unlockIfNeeded(offset);
    const bufferSource = context.createBufferSource();
    bufferSources.current[soundID]?.disconnect();
    bufferSources.current[soundID] = bufferSource;
    bufferSource.buffer = buffers.current[soundID];
    bufferSource.connect(destination);
    bufferSource.start(0, delayedOffset);
  }

  const stopBuffer = useCallback((soundID: string) => {
    const bufferSource = bufferSources.current[soundID];
    bufferSource?.disconnect();
    if (bufferSource) bufferSource.onended = null;
    delete bufferSources.current[soundID];
  }, []);

  const getLoadedSounds = useCallback(() => Object.keys(buffers.current), []);

  const stopAll = useCallback(async () => {
    Object.keys(bufferSources.current).forEach(stopBuffer);
  }, [stopBuffer]);

  return {
    loadBuffer,
    stopBuffer,
    getVisualizerData,
    getLoadedSounds,
    loadBufferFromFile,
    playBuffer,
    playBufferAtOffset,
    stopAll,
    volume,
    setVolume,
    onCompleted,
    loadBuffers,
    durations: durations.current,
  };
}
