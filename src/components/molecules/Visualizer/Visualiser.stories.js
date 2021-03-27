import Visualizer from "./Visualizer";

export default {
  title: "Molecules/Visualiser",
  component: Visualizer,
};

function range(n) {
  return new Array(n).fill(0).map((_, i) => i);
}

function getData() {
  return Uint8Array.from(range(32).map((i) => (i / 32) * 255));
}

export const AudioVisualizer = () => <Visualizer getData={getData} />;
