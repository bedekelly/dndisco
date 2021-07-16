import React, { useState } from "react";

import ScreenCenter from "../../atoms/ScreenCenter";
import VolumeSlider from "../../molecules/VolumeSlider/VolumeSlider";
import { useAudioContext } from "../../../audio/AudioContextProvider";

export default function GuestUI() {
  const [volume, setVolume] = useState(0.5);
  const { running } = useAudioContext();
  return (
    <>
      <div className={"absolute top-4 right-4"}></div>
      <ScreenCenter>
        {running && <VolumeSlider value={volume} setValue={setVolume} />}
      </ScreenCenter>
    </>
  );
}
