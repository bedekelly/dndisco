import { useAudioContext } from "./AudioContextProvider";
import { useEffect, useMemo, useRef, useState } from "react";

const GUEST_DELAY_TIME = 0;

/**
 * Create a stereo panner node (in a way that works for both Safari and Chrome).
 */
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

/**
 * Create an audio destination which also exposes a function to get visualiser data
 * on each animation frame. This is also where a pan/delay is introduced to aid with
 * debugging, and where a `gain` node is introduced to provide volume control.
 */
export default function useVisualisedDestination(
  hostOrGuest: "host" | "guest",
  debugWithPan: boolean = true
) {
  const { context } = useAudioContext();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [volume, setVolume] = useState(0.8);

  const destination = useMemo(() => {
    if (!context) return;
    const pan = createPanner(
      context,
      debugWithPan ? (hostOrGuest === "host" ? -1 : 1) : 0
    );
    const delay = context.createDelay();
    const gain = (gainRef.current = context.createGain());
    const analyser = (analyserRef.current = context.createAnalyser());
    analyser.fftSize = 32;
    delay.delayTime.value = hostOrGuest === "host" ? 0 : GUEST_DELAY_TIME;
    pan.connect(delay);
    delay.connect(gain);
    gain.connect(analyser);
    analyser.connect(context.destination);
    return pan;
  }, [context, debugWithPan, hostOrGuest]);

  /**
   * Update the gain node's volume when the volume state changes.
   */
  useEffect(() => {
    gainRef.current?.gain.setValueAtTime(volume, 0);
  }, [volume]);

  function getVisualizerData(oldArray?: Uint8Array): Uint8Array {
    const analyserNode = analyserRef.current;
    if (!analyserNode) return new Uint8Array(0);
    const bufferLength = analyserNode.frequencyBinCount;
    let array = oldArray;
    if (!array) array = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(array);
    return array;
  }

  return { destination, getVisualizerData, volume, setVolume };
}
