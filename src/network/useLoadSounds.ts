import { useCallback } from "react";
import { AudioControls } from "../audio/useBuffers";
import { apiURL } from "./api";

export async function loadSounds(soundIDs: string[], audio: AudioControls) {
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
}

export default function useLoadSounds(
  audio: AudioControls
): (soundIDs: string[]) => Promise<(AudioBuffer | undefined)[]> {
  return useCallback(
    async (soundIDs: string[]) => loadSounds(soundIDs, audio),
    // Todo: memoize audio if at all possible.
    // eslint-disable-next-line
    []
  );
}
