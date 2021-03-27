import { useAudioContext } from "./AudioContextProvider";
import { useMemo, useRef, useState } from "react";
import decodeAudioFile from "./decodeAudioFile";
import { v4 as uuid } from "uuid";
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

export function useBuffers(hostOrGuest: 'host' | 'guest') {
  const { context, unlock } = useAudioContext() || {};
  const [buffers, setBuffers] = useState<{ [id: string]: AudioBuffer }>({});
  const bufferSources = useRef<{ [id: string]: AudioBufferSourceNode }>({});
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
  }, [context, hostOrGuest]);

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

  async function loadBuffer(id: string, buffer: ArrayBuffer) {
    if (!context) return;
    return context.decodeAudioData(buffer, (decodedData: AudioBuffer) => {
      console.log(`Loaded audio buffer ${id} successfully`);
      setBuffers((buffers) => ({ ...buffers, [id]: decodedData }));
    });
  }

  async function playBuffer(soundID: string) {
    if (!context || !unlock || !destination) return;
    await unlock();
    console.log("Playing buffer for soundID", soundID);
    const bufferSource = context.createBufferSource();
    bufferSources.current[soundID]?.disconnect();
    bufferSources.current[soundID] = bufferSource;
    bufferSource.buffer = buffers[soundID];
    console.log({ destination, buffer: buffers[soundID], bufferSource });
    bufferSource.connect(destination);
    bufferSource.start(0);
  }

  function getVisualizerData(oldArray: Uint8Array) {
    const analyserNode = analyserRef.current;
    if (!analyserNode) return oldArray;
    const bufferLength = analyserNode.frequencyBinCount;
    let array = oldArray;
    if (!array) array = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(array);
    return array;
  }

  return { loadBuffer, getVisualizerData, loadBufferFromFile, playBuffer };
}
