import React, { useRef, useState } from "react";
import { useAnimationFrame, useCanvas } from "./Visualizer/Visualizer";

type VisualizerProps = {
  getData: (oldArray?: Uint8Array) => Uint8Array;
};

export default function LineVisualizer({ getData }: VisualizerProps) {
  const [smooth] = useState(true);
  const dataRef = useRef<Uint8Array | undefined>();
  const { canvasRef, context, width, height } = useCanvas();
  const lastTime = useRef(0);

  useAnimationFrame(() => {
    if (!context) return;
    const data = (dataRef.current = getData(dataRef.current));
    if (smooth || performance.now() - 100 > lastTime.current) {
      lastTime.current = performance.now();
      context.clearRect(0, 0, width + 1, height + 1);
      const length = data.length - 3; // Trim off top 3 frequency bins.

      context.strokeStyle = "black";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(-context.lineWidth * 2, 0);
      for (let i = 0; i < length; i++) {
        let fraction = data[i] / 255;

        // Make it a bit more dramatic
        fraction = Math.min(Math.pow(fraction * 2, 1.3) / 2, 1);
        if (fraction !== 0)
          context.lineTo(
            (i / length) * width,
            (1 - fraction) * height + context.lineWidth
          );
      }
      context.stroke();
    }
  });

  return <canvas className="w-full mt-16 h-5 bg-white" ref={canvasRef} />;
}
