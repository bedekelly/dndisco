import React from "react";

import TrafficLightDot from "../../atoms/TrafficLightDot";
import ScreenCenter from "../../atoms/ScreenCenter";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import VolumeSlider from "../../molecules/VolumeSlider/VolumeSlider";
import useNetworkSound from "../../../network/useNetworkSound";

export default function GuestUI() {
  const {
    unlock,
    running,
    synced,
    connected,
    getVisualizerData,
    volume,
    setVolume,
  } = useNetworkSound();
  return (
    <>
      <div className={"absolute top-4 right-4"}>
        <TrafficLightDot
          color={connected ? (synced ? "green" : "amber") : "red"}
        />
      </div>
      <ScreenCenter>
        {!running && <button onClick={unlock}>Click me to unlock audio</button>}
        {running && <Visualizer getData={getVisualizerData} />}
        {running && <VolumeSlider value={volume} setValue={setVolume} />}
      </ScreenCenter>
    </>
  );
}
