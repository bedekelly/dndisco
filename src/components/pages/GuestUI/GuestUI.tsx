import ScreenCenter from "../../atoms/ScreenCenter";
import VolumeSlider from "../../molecules/VolumeSlider/VolumeSlider";
import UnlockAudio from "../../../audio/UnlockAudio";
import Visualizer from "../../molecules/Visualizer/Visualizer";
import { useBuffers } from "../../../audio/useBuffers";
import useNetworkSound from "../../../network/useNetworkSound";
import TrafficLightDot from "../../atoms/TrafficLightDot";

type GuestUIProps = {
  params: {
    sessionID: string;
  };
};

export default function GuestUI({ params: { sessionID } }: GuestUIProps) {
  const audio = useBuffers("guest");
  const networkState = useNetworkSound(audio, sessionID);

  return (
    <UnlockAudio>
      <div className={"absolute top-4 right-4"}>
        <TrafficLightDot
          color={networkState === "loading" ? "amber" : "green"}
        />
      </div>
      <ScreenCenter>
        <div className="flex flex-col items-center">
          <Visualizer size="big" getData={audio.getVisualizerData} />
          <VolumeSlider
            value={audio.volume}
            setValue={(vol) => audio.setVolume(vol)}
          />
        </div>
      </ScreenCenter>
    </UnlockAudio>
  );
}
