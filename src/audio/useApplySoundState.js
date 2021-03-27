import { useAudioContext } from "./AudioContextProvider";
import {useEffect, useRef, useState} from "preact/hooks";
import decodeAudioFile from "./decodeAudioFile";
import {PlaybackState} from "../state/playbackState";

function usePrevious(value) {
  const previousValue = useRef(null);
  useEffect(() => {
    previousValue.current = value;
  });
  return previousValue.current;
}

export default function useApplySoundState(sharedState) {
  const previousState = usePrevious(sharedState);
  const { context } = useAudioContext();
  const [buffers, setBuffers] = useState({});
  const [synchronising, setSynchronising] = useState(false);
  const bufferSourceNodes = useRef({});

  useEffect(() => {
    const newBuffers = { ...buffers };
    setSynchronising(true);
    const loadAllBuffers = [];
    for (let pad of sharedState.pads) {
      if (newBuffers[pad.soundID]) continue;
      if (!pad.soundID) continue;
      const { file } = sharedState.soundFiles[pad.soundID];
      if (!file) continue; // Todo: Check for `url` property too!
      loadAllBuffers.push(decodeAudioFile(context, file).then(
        decodedBuffer => { newBuffers[pad.soundID] = decodedBuffer; }
      ));
    }
    Promise.all(loadAllBuffers).then(() => {
      if (loadAllBuffers.length > 0) setBuffers(newBuffers);
      setSynchronising(false);
    });
  }, [context, buffers, sharedState]);

  useEffect(() => {
    const previousPlaybackState = previousState?.playbackState;
    const wasStopped = soundID => (
      previousPlaybackState[soundID] === PlaybackState.Stopped
      || previousPlaybackState[soundID] == null
    );
    for (let [soundID, playbackState] of Object.entries(sharedState.playbackState)) {
      if (playbackState !== PlaybackState.Stopped && wasStopped(soundID)) {
        console.log(`Playing soundID(${soundID})`)
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = buffers[soundID];
        bufferSource.connect(context.destination);
        bufferSource.start(playbackState || 0);
        bufferSource.onended = event => {
          console.log("Ended", event.target, bufferSource);
          bufferSource.disconnect();
          delete bufferSourceNodes[soundID];
        }
        bufferSourceNodes[soundID] = bufferSource;
      } else if (!wasStopped(soundID) && playbackState === PlaybackState.Stopped) {
        const bufferSource = bufferSourceNodes[soundID];
        bufferSource.disconnect();
        delete bufferSourceNodes[soundID];
      }
    }
  }, [buffers, context, previousState?.playbackState, sharedState.playbackState]);

  return { synchronising };
}
