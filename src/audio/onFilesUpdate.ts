import { mapValues, pickBy } from "lodash";
import { AudioControls } from "../audio/useBuffers";
import globalSocket from "../network/globalSocket";
import fetchSound from "../network/fetchSound";
import produceMap from "../utilities/produceMap";

export default async function onFilesUpdate(
  audio: AudioControls,
  soundIDs: string[],
  playing: Record<string, number>,
  firstTime: boolean
) {
  // Decode and load each new audio file into a buffer.
  const loadSoundsStartTime = performance.now();
  const loadedSounds = new Set(audio.getLoadedSounds());
  const soundsToLoad = soundIDs.filter((soundID) => !loadedSounds.has(soundID));

  if (soundsToLoad.length) {
    const allSounds = await produceMap(soundsToLoad, fetchSound);
    await audio.loadBuffers(allSounds);
  }

  // Get the new sounds from the audio module, and check how long we've taken.
  const newLoadedSounds = audio.getLoadedSounds();
  const newTime = performance.now();
  const offset = (newTime - loadSoundsStartTime) / 1000;

  // Use the timings to dispatch "play" messages for each sound.
  const adjustedPlaying = mapValues(
    pickBy(
      playing,
      (_val: number, soundID: string) =>
        // If it's the first time we get a files update, trigger *everything* to play.
        // Otherwise, only touch the sounds we *didn't* have loaded at the start.
        firstTime || soundsToLoad.includes(soundID) || true
    ),
    (serverOffset) => serverOffset / 1000 + offset
  );

  Object.entries(adjustedPlaying).forEach(([soundID, offset]) => {
    audio.playBufferAtOffset(soundID, offset);
  });

  // Let the server know we've got the files we just loaded.
  if (soundsToLoad.length) globalSocket.emit("gotFiles", newLoadedSounds);
}
