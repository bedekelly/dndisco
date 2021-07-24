import { useCallback } from "react";
import { AudioControls } from "../audio/useBuffers";
import { apiURL } from "./api";

export default function useLoadSounds(
  audio: AudioControls
): (soundIDs: string[]) => Promise<(AudioBuffer | undefined)[]> {
  return useCallback(async (soundIDs: string[]) => {
    const allLoadedSounds = new Set(audio.getLoadedSounds());
    const missingSounds = soundIDs.filter(
      (soundID) => !allLoadedSounds.has(soundID)
    );
    const loadingEverything = missingSounds.map((soundID) =>
      fetch(`${apiURL}/files/${soundID}`)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audio.loadBuffer(soundID, arrayBuffer))
    );
    return Promise.all(loadingEverything);

    // Todo: memoize audio, for goodness' sake!
    // eslint-disable-next-line
  }, []);
}
