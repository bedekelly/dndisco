import { mapValues, pick, pickBy, zip } from "lodash";
import { apiURL } from "../components/pages/CreateSession";
import { Audio } from "../audio/useBuffers";
import { Socket } from "socket.io-client";
import globalSocket from "../globalSocket";

/**
 * Given a set of inputs and a "producer" function, deliver a map
 * of inputs to outputs when all the outputs are settled.
 */
async function produceMap<T extends string | number | symbol, U>(
  inputKeys: T[],
  producer: (input: T) => Promise<U>
): Promise<Record<T, U>> {
  const values = await Promise.all(inputKeys.map(producer));
  return Object.fromEntries(zip(inputKeys, values));
}

/**
 * Fetch a sound ID from the server, returning an arraybuffer.
 */
const fetchSound = (soundID: string) =>
  fetch(`${apiURL}/files/${soundID}`).then((response) =>
    response.arrayBuffer()
  );

export default async function filesUpdate(
  audio: Audio,
  soundIDs: string[],
  playing: Record<string, number>,
  firstTime: boolean
) {
  // Decode and load each new audio file into a buffer.
  console.log("filesUpdate", soundIDs, playing);
  const loadSoundsStartTime = performance.now();
  const loadedSounds = new Set(audio.getLoadedSounds());
  const soundsToLoad = soundIDs.filter((soundID) => !loadedSounds.has(soundID));
  console.log({ soundsToLoad });

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

  console.log({ adjustedPlaying });
  Object.entries(adjustedPlaying).forEach(([soundID, offset]) => {
    audio.playBufferAtOffset(soundID, offset);
  });

  // Let the server know we've got the files we just loaded.
  if (soundsToLoad.length) globalSocket.emit("gotFiles", newLoadedSounds);
}
