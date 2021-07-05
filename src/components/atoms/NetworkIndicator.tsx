import TrafficLightDot, { Color } from "./TrafficLightDot";

export type NetworkState = "disconnected" | "syncing" | "ready";

const stateColor: Record<NetworkState, Color> = {
  disconnected: "red",
  syncing: "amber",
  ready: "green",
};

export default function NetworkIndicator({
  networkState,
  numberClients,
}: {
  networkState: NetworkState;
  numberClients: number;
}) {
  return (
    <div className="absolute w-full p-4">
      {networkState !== "disconnected" ? (
        <p>
          {numberClients} connected{" "}
          {networkState === "syncing" && "(Syncing...)"}
        </p>
      ) : (
        <p>Connecting...</p>
      )}
      <div className="absolute right-4 top-4">
        <TrafficLightDot color={stateColor[networkState]} />
      </div>
    </div>
  );
}
