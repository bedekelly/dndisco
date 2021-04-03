import TrafficLightDot from "./TrafficLightDot";

export default function NetworkIndicator({
  connected,
  synced,
  numberClients,
  decoding,
}: {
  connected: boolean;
  synced: boolean;
  numberClients: number;
  decoding: boolean;
}) {
  return (
    <div className="absolute w-full p-4">
      {connected ? (
        <p>
          {numberClients} connected {!synced && "(Syncing...)"}
        </p>
      ) : (
        <p>Connecting...</p>
      )}
      {decoding && "Decoding..."}
      <div className="absolute right-4 top-4">
        <TrafficLightDot
          color={connected ? (synced ? "green" : "amber") : "red"}
        />
      </div>
    </div>
  );
}
