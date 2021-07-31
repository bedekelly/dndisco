import TrafficLightDot from "./TrafficLightDot";

export default function NetworkIndicator({
  connected,
  synced,
  numberClients,
}: {
  connected: boolean;
  synced: boolean;
  numberClients: number;
}) {
  return (
    <div className="absolute left-4 top-4 flex items-center">
      <TrafficLightDot
        color={connected ? (synced ? "green" : "amber") : "red"}
      />
      <span className="ml-2">
        {connected ? `${numberClients} joined` : "Connecting..."}
        {/* <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5 inline-block text-gray-400 ml-0.5 pb-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg> */}
      </span>
    </div>
  );
}
