import { useAudioContext } from "./AudioContextProvider";
import { useCallback, useRef, useState } from "react";
import decodeAudioFile from "./decodeAudioFile";
import { v4 as uuid } from "uuid";
import useVisualisedDestination from "./useVisualisedDestination";

export type BufferLoadedInfo = {
  encodedData: ArrayBuffer;
  soundID: string;
  fileName: string;
  duration: number;
};

export function useBuffers(hostOrGuest: "host" | "guest") {
  const { context, unlock } = useAudioContext();
  const [buffers, setBuffers] = useState<Record<string, AudioBuffer>>({});
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
    setBuffers({ ...buffers, [soundID]: decodedData });
    return { encodedData, soundID, fileName, duration };
  }

  const loadBuffer = useCallback(
    async (id: string, buffer: ArrayBuffer) => {
      if (!context || buffer.byteLength === 0) return;
      return context.decodeAudioData(buffer, (decodedData: AudioBuffer) => {
        setBuffers((buffers) => ({ ...buffers, [id]: decodedData }));
      });
    },
    [context]
  );

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

  async function playBufferAtOffset(soundID: string, offset: number) {
    if (destination == null) return;
    let delayedOffset = await unlockIfNeeded(offset);
    const bufferSource = context.createBufferSource();
    bufferSources.current[soundID]?.disconnect();
    bufferSources.current[soundID] = bufferSource;
    bufferSource.buffer = buffers[soundID];
    bufferSource.connect(destination);
    bufferSource.start(0, delayedOffset);
  }

  const stopBuffer = useCallback((soundID: string) => {
    bufferSources.current[soundID]?.disconnect();
    delete bufferSources.current[soundID];
  }, []);

  const getLoadedSounds = useCallback(() => Object.keys(buffers), [buffers]);

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
  };
}
