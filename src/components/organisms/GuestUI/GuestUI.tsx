import React from "react";

import ScreenCenter from "../../atoms/ScreenCenter";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import useNetworkSound from "../../../network/useNetworkSound";

export default function GuestUI() {
  const { unlock, running, getVisualizerData } = useNetworkSound();
  return (
    <>
      <ScreenCenter>
        {!running && (
          <button onClick={unlock}>Click me to unlock audio</button>
        )}
        {running && <Visualizer getData={getVisualizerData} />}
      </ScreenCenter>
    </>
  );
}
