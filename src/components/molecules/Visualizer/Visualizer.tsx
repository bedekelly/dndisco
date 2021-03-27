import React, { useEffect, useRef, useState } from "react";

type Dimensions = {
  width: number;
  height: number;
};

function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setContext(canvas.getContext("2d"));

    const dpi = window.devicePixelRatio || 1;
    const { height, width } = canvas.getBoundingClientRect();
    canvas.height = height * dpi;
    canvas.width = width * dpi;
    setDimensions({ width: canvas.width, height: canvas.height });
  }, []);

  return {
    canvasRef,
    context,
    ...dimensions,
  };
}

function useAnimationFrame(animationFrameCallback: () => void) {
  const animationFrameRef = useRef<number>();
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    function run() {
      animationFrameCallback();
      animationFrameRef.current = requestAnimationFrame(run);
    }

    const cancel = () =>
      animationFrameRef.current &&
      void cancelAnimationFrame(animationFrameRef.current);

    if (playing) animationFrameRef.current = requestAnimationFrame(run);
    else cancel();

    return () => void cancel();
  }, [animationFrameCallback, playing]);

  return { setPlaying };
}

type VisualizerProps = {
  getData: (oldArray?: Uint8Array) => Uint8Array;
};

export default function Visualizer({ getData }: VisualizerProps) {
  const [smooth] = useState(true);
  const dataRef = useRef<Uint8Array | undefined>();
  const { canvasRef, context, width, height } = useCanvas();
  const lastTime = useRef(0);

  useAnimationFrame(() => {
    if (!context) return;
    const data = (dataRef.current = getData(dataRef.current));
    if (smooth || performance.now() - 100 > lastTime.current) {
      lastTime.current = performance.now();
      context.clearRect(0, 0, width, height);
      const length = data.length - 3; // Trim off top 3 frequency bins.
      for (let i = 0; i < length; i++) {
        const fraction = data[i] / 255;
        context.fillStyle = "white";
        const BAR_PADDING = 2;
        const barWidth = width / length;
        context.fillRect(
          i * barWidth + BAR_PADDING,
          height * (1 - fraction),
          barWidth - BAR_PADDING * 2,
          height * fraction
        );
      }
    }
  });

  return (
    <div className="bg-blue-300 shadow-2xl w-28 h-28 rounded-2xl">
      <canvas className="w-28 h-28 bg-gray-400 rounded-2xl" ref={canvasRef} />
    </div>
  );
}
