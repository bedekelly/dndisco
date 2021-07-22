import React, { useEffect } from "react";

import ScreenCenter from "../../atoms/ScreenCenter";
import VolumeSlider from "../../molecules/VolumeSlider/VolumeSlider";
import UnlockAudio from "../../../audio/UnlockAudio";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import { Audio, useBuffers } from "../../../audio/useBuffers";
import globalSocket from "../../../globalSocket";
import { apiURL } from "../../pages/CreateSession";
import { zip } from "lodash";

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

function useNetworkSound(audio: Audio, sessionID: string) {
  useEffect(() => {
    globalSocket.on(
      "whoAreYou",
      (replyWith: (sessionID: string, role: "host" | "guest") => void) => {
        console.log("hello?");
        replyWith(sessionID, "guest");
      }
    );

    globalSocket.on("filesUpdate", async (soundIDs: string[]) => {
      console.log("filesUpdate", soundIDs);
      const loadedSounds = new Set(audio.getLoadedSounds());
      console.log({ loadedSounds });
      const soundsToLoad = soundIDs.filter(
        (soundID) => !loadedSounds.has(soundID)
      );
      if (!soundsToLoad.length) return;
      console.log({ soundsToLoad }, soundsToLoad.length);
      const allSounds = await produceMap(soundsToLoad, fetchSound);
      console.log({ allSounds });
      await audio.loadBuffers(allSounds);
      const newLoadedSounds = audio.getLoadedSounds();
      console.log("loaded all buffers", newLoadedSounds);
      globalSocket.emit("gotFiles", newLoadedSounds);
    });

    globalSocket.on("play", (soundID: string) => {
      audio.playBuffer(soundID);
    });
    globalSocket.on("stop", (soundID: string) => {
      audio.stopBuffer(soundID);
    });

    return () => {
      globalSocket.off("whoAreYou");
      globalSocket.off("filesUpdate");
      globalSocket.off("play");
      globalSocket.off("stop");
      globalSocket.close();
    };
    // Todo: can we memoize `audio` somehow?
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionID]);
}

type GuestUIProps = {
  params: {
    sessionID: string;
  };
};

export default function GuestUI({ params: { sessionID } }: GuestUIProps) {
  const audio = useBuffers("guest");
  useNetworkSound(audio, sessionID);

  return (
    <UnlockAudio>
      {/* <div className={"absolute top-4 right-4"}></div> */}
      <ScreenCenter>
        <div className="flex flex-col items-center">
          <Visualizer getData={audio.getVisualizerData} />
          <VolumeSlider
            value={audio.volume}
            setValue={(vol) => audio.setVolume(vol)}
          />
        </div>
      </ScreenCenter>
    </UnlockAudio>
  );
}
