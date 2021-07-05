import { useState } from "react";
import NetworkIndicator, { NetworkState } from "../../atoms/NetworkIndicator";

function useSessionID() {
  return "Session1";
}

function useNetworkData(sessionID: string) {
  const [networkState, setNetworkState] = useState<NetworkState>(
    "disconnected"
  );
  const [numberClients, setNumberClients] = useState(0);
  const [networkData, setNetworkData] = useState(null);

  return { networkState, networkData, numberClients };
}

export default function HostUI() {
  const sessionID = useSessionID();
  const { networkState, networkData, numberClients } = useNetworkData(
    sessionID
  );

  return (
    <>
      <NetworkIndicator
        networkState={networkState}
        numberClients={numberClients}
      />
      <ScreenCenter>
        <Visualizer getData={getVisualizerData} />
        {pads.map((pad, index) => (
          <UploadPad
            key={index}
            play={() => playPad(pad.soundID)}
            stop={() => stopPad(pad.soundID)}
            fileName={pad.fileName}
            onLoadFile={(file: File) => fileLoaded(index, file)}
          />
        ))}
      </ScreenCenter>
      <StopEverything onClick={stopEverything} />
    </>
  );
}
