import { useCallback, useEffect, useRef } from "react";
import { Subject } from "rxjs";
import { BufferLoadedInfo } from "../../../audio/useBuffers";
import usePersistentState from "../../../state/usePersistentState";
import { Message } from "../../../sharedTypes";

function makePad() {
  return {
    filename: null,
    soundID: null,
    loading: false,
  };
}

function makeInitialPads(): Pad[] {
  return Array(2).fill(0).map(makePad);
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
  return pads.map((pad) => ({
    ...pad,
    loading: !!pad.soundID,
  }));
}

export default function usePads(
  audio: BufferAudio,
  uploadFile: (file: File) => Promise<string>,
  loadSounds: (soundIDs: string[]) => Promise<(AudioBuffer | undefined)[]>,
  messages: Subject<Message>
) {
  const [pads, setPads] = usePersistentState<Pad[]>(
    "pads",
    makeInitialPads,
    preSave
  );
  const loadedPads = useRef(new Set());

  useEffect(() => {
    async function loadAllPads() {
      const padsToLoad = pads
        .filter((pad) => pad.soundID)
        .map(({ soundID }) => soundID) as string[];

      if (!padsToLoad.length) return;
      if (!pads.some((pad) => pad.loading)) return;
      if (padsToLoad.every((soundID) => loadedPads.current.has(soundID)))
        return;

      await loadSounds(padsToLoad);
      for (let pad of padsToLoad) {
        loadedPads.current.add(pad);
      }
      setPads((oldPads) =>
        oldPads.map((pad) =>
          pad.soundID && padsToLoad.includes(pad.soundID)
            ? { ...pad, loading: false }
            : pad
        )
      );
    }
    loadAllPads();

    const loadedPadsCurrent = loadedPads.current;
    return () => {
      loadedPadsCurrent?.clear();
    };
  }, [pads, loadSounds, setPads]);

  function playPad(i: number) {
    const { soundID } = pads[i];
    if (soundID == null) return;
    messages.next({ type: "play", soundID });
    audio.playBuffer(soundID);
  }

  const onServerFiles = useCallback(
    function onServerFiles(serverFiles: string[]) {
      setPads((oldPads) =>
        oldPads.map((pad) => {
          if (serverFiles.includes(pad.soundID || "")) {
            return pad;
          }
          return makePad();
        })
      );
    },
    [setPads]
  );

  function stopPad(i: number) {
    const { soundID } = pads[i];
    if (soundID == null) return;
    messages.next({ type: "stop", soundID });
    audio.stopBuffer(soundID);
  }

  async function onLoadFile(padIndex: number, file: File) {
    setPads((oldPads) => {
      const newPads = [...oldPads];
      newPads[padIndex] = { filename: null, soundID: null, loading: true };
      return newPads;
    });
    const soundID = await uploadFile(file);
    await audio.loadBufferFromFile(file, soundID);
    setPads((oldPads) => {
      const newPads = [...oldPads];
      newPads[padIndex] = { filename: file.name, soundID, loading: false };
      return newPads;
    });
  }

  return { pads, playPad, stopPad, onLoadFile, onServerFiles };
}
