import { useAudioContext } from "./AudioContextProvider";
import {useCallback, useMemo, useRef, useState} from "react";
import decodeAudioFile from "./decodeAudioFile";
import { v4 as uuid } from "uuid";
import {EventData, InitialLoadPayload} from "../network/useSockets";
const GUEST_DELAY_TIME = 0;

function createPanner(context: AudioContext, pan: number) {
  let panner;
  if (context.createStereoPanner) {
    panner = context.createStereoPanner();
    panner.pan.value = pan;
  } else {
    panner = context.createPanner();
    panner.panningModel = "equalpower";
    panner.setPosition(pan, 0, 1 - Math.abs(pan));
  }
  return panner;
}

type BufferLoadedInfo = {
  encodedData: ArrayBuffer,
  soundID: string,
  fileName: string
}

export function loadInitialBuffers(event: EventData, loadBuffer: (id: string, buffer: ArrayBuffer) => Promise<undefined | AudioBuffer>) {
  const {files} = event.payload as InitialLoadPayload;
  const loadFiles = Object.entries(files).map(([id, data]) =>
    loadBuffer(id, data).then(() => id)
  );
  return Promise.all(loadFiles);
}

function useVisualisedDestination(hostOrGuest: "host" | "guest") {
  const { context } = useAudioContext();
  const analyserRef = useRef<AnalyserNode | null>(null);


  const destination = useMemo(() => {
    if (!context) return;
    const pan = createPanner(context, hostOrGuest === "host" ? -0.5 : 0.5);
    const delay = context.createDelay();
    const analyser = (analyserRef.current = context.createAnalyser());
    analyser.fftSize = 32;
    delay.delayTime.value = hostOrGuest === "host" ? 0 : GUEST_DELAY_TIME;
    pan.connect(delay);
    delay.connect(analyser);
    analyser.connect(context.destination);
    return pan;
  }, [analyserRef, context, hostOrGuest]);

  function getVisualizerData(oldArray?: Uint8Array): Uint8Array {
    const analyserNode = analyserRef.current;
    if (!analyserNode) return new Uint8Array(0);
    const bufferLength = analyserNode.frequencyBinCount;
    let array = oldArray;
    if (!array) array = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(array);
    return array;
  }

  return { destination, getVisualizerData };
}

export function useBuffers(hostOrGuest: 'host' | 'guest') {
  const { unlock, context } = useAudioContext();
  const [buffers, setBuffers] = useState<Record<string, AudioBuffer>>({});
  const bufferSources = useRef<Record<string, AudioBufferSourceNode>>({});
  const { destination, getVisualizerData } = useVisualisedDestination(hostOrGuest);

  async function loadBufferFromFile(soundFile: File): Promise<BufferLoadedInfo> {
    const { encodedData, decodedData } = await decodeAudioFile(
      context,
      soundFile
    );
    const soundID = uuid();
    const fileName = soundFile.name;
    setBuffers({ ...buffers, [soundID]: decodedData });
    return { encodedData, soundID, fileName };
  }

  const loadBuffer = useCallback(async (id: string, buffer: ArrayBuffer) => {
    if (!context || buffer.byteLength === 0) return;
    return context.decodeAudioData(buffer, (decodedData: AudioBuffer) => {
      setBuffers((buffers) => ({ ...buffers, [id]: decodedData }));
    });
  }, [context]);

  async function playBuffer(soundID: string) {
    if (!context || !unlock || !destination) return;
    await unlock();
    const bufferSource = context.createBufferSource();
    bufferSources.current[soundID]?.disconnect();
    bufferSources.current[soundID] = bufferSource;
    bufferSource.buffer = buffers[soundID];
    bufferSource.connect(destination);
    bufferSource.start(0);
  }

  const stopBuffer = useCallback((soundID: string) => {
    bufferSources.current[soundID]?.disconnect();
    delete bufferSources.current[soundID];
  }, []);

  const getLoadedSounds = useCallback(() => Object.keys(buffers), [buffers]);

  const stopAll = useCallback(async () => {
    Object.keys(bufferSources.current).forEach(stopBuffer);
  }, [stopBuffer]);

  return { loadBuffer, stopBuffer, getVisualizerData, getLoadedSounds, loadBufferFromFile, playBuffer, stopAll };
}
