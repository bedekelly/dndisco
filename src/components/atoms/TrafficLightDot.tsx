type Color = "red" | "amber" | "green";

const dotStyles = {
  green: "bg-green-300",
  amber: "bg-yellow-300 animate-pulse",
  red: "bg-red-400",
};

export default function TrafficLightDot({ color }: { color: Color }) {
  const dotStyle = dotStyles[color];
  return (
    <div
      className={`${dotStyle} w-5 h-5 rounded-full shadow-xl shadow-inner`}
    />
  );
}
