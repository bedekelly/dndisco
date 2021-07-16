import { ReactNode } from "react";
import ScreenCenter from "../components/atoms/ScreenCenter";
import { useAudioContext } from "./AudioContextProvider";

export default function UnlockAudio({ children }: { children: ReactNode }) {
  const { running, unlock } = useAudioContext();
  if (running) return <>{children}</>;
  return (
    <ScreenCenter>
      <button onClick={unlock}>Click me to unlock audio</button>
    </ScreenCenter>
  );
}
