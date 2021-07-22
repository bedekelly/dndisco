import React, { useEffect, useRef } from "react";

import ScreenCenter from "../../atoms/ScreenCenter";
import VolumeSlider from "../../molecules/VolumeSlider/VolumeSlider";
import UnlockAudio from "../../../audio/UnlockAudio";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import { Audio, useBuffers } from "../../../audio/useBuffers";
import globalSocket from "../../../globalSocket";
import onFilesUpdate from "../../../audio/onFilesUpdate";

function useNetworkSound(audio: Audio, sessionID: string) {
  const firstLoad = useRef(true);

  useEffect(() => {
    globalSocket.on(
      "whoAreYou",
      (replyWith: (sessionID: string, role: "host" | "guest") => void) => {
        replyWith(sessionID, "guest");
      }
    );

    globalSocket.on(
      "filesUpdate",
      (files: string[], playing: Record<string, number>) => {
        onFilesUpdate(audio, files, playing, firstLoad.current).then(() => {
          firstLoad.current = false;
        });
      }
    );

    globalSocket.on("play", (soundID: string) => {
      audio.playBuffer(soundID);
    });
    globalSocket.on("stop", (soundID: string) => {
      audio.stopBuffer(soundID);
    });
    globalSocket.on("stopAll", () => {
      audio.stopAll();
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
