import { useEffect, useRef } from "react";
import { BufferLoadedInfo } from "../../../audio/useBuffers";
import usePersistentState from "../../../state/usePersistentState";

function makeInitialPads(): Pad[] {
  return Array(2)
    .fill(0)
    .map(() => ({
      filename: null,
      soundID: null,
      loading: false,
    }));
}

type EmptyPad = {
  soundID: null;
  filename: null;
  loading: boolean;
};

type PopulatedPad = {
  soundID: string;
  filename: string;
  loading: boolean;
};

type Pad = EmptyPad | PopulatedPad;

type BufferAudio = {
  playBuffer: (soundID: string) => void;
  stopBuffer: (soundID: string) => void;
  loadBufferFromFile: (
    soundFile: File,
    soundID: string
  ) => Promise<BufferLoadedInfo>;
};

/**
 * Before saving our pads to localstorage, set their 'loading' property.
 * This means they'll be "loading" by default when the page reloads.
 * When they successfully load, this will be set back to false.
 *
 * N.B. If the pad is empty, don't set "loading" to true.
 */
function preSave(pads: Pad[]) {
  return pads.map((pad) => ({ ...pad, loading: !!pad.soundID }));
}

export default function usePads(
  audio: BufferAudio,
  uploadFile: (file: File) => Promise<string>,
  loadSounds: (soundIDs: string[]) => Promise<AudioBuffer | undefined>[]
) {
  const [pads, setPads] = usePersistentState<Pad[]>(
    "pads",
    makeInitialPads,
    preSave
  );
  console.log({ pads });
  const loadedPads = useRef(new Set());

  useEffect(() => {
    async function loadAllPads() {
      const padsToLoad = pads
        .filter((pad) => pad.soundID)
        .map(({ soundID }) => soundID) as string[];

      if (!padsToLoad.length) return;

      // Avoid infinite loop.
      console.log({ loadedPads });
      if (padsToLoad.every((soundID) => loadedPads.current.has(soundID)))
        return;

      await Promise.all(loadSounds(padsToLoad));
      for (let pad of padsToLoad) {
        loadedPads.current.add(pad);
      }
      console.log("Set loading false");
      setPads((oldPads) => oldPads.map((pad) => ({ ...pad, loading: false })));
    }
    loadAllPads();
  }, [pads, loadSounds, setPads]);

  function playPad(i: number) {
    const { soundID } = pads[i];
    if (soundID == null) return;
    audio.playBuffer(soundID);
  }

  function stopPad(i: number) {
    const { soundID } = pads[i];
    if (soundID) audio.stopBuffer(soundID);
  }

  async function onLoadFile(padIndex: number, file: File) {
    // Todo: upload file in parallel.
    console.log({ padIndex, file });
    setPads((oldPads) => {
      const newPads = [...oldPads];
      newPads[padIndex] = { filename: null, soundID: null, loading: true };
      return newPads;
    });
    console.log("set pads done");
    const soundID = await uploadFile(file);
    await audio.loadBufferFromFile(file, soundID);
    setPads((oldPads) => {
      const newPads = [...oldPads];
      newPads[padIndex] = { filename: file.name, soundID, loading: false };
      return newPads;
    });
  }

  return { pads, playPad, stopPad, onLoadFile };
}
