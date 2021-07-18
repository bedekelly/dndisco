import { useEffect, useRef } from "react";

export default function MiniVisualiser() {
  const animationFrameRef = useRef<number>();
  const ref1 = useRef<HTMLDivElement | null>(null);
  const ref2 = useRef<HTMLDivElement | null>(null);
  const ref3 = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref1.current) return;

    function barTick() {
      if (!ref1.current) return;
      ref1.current.style.transform = `scaleY(${Math.abs(
        Math.sin((Date.now() / 250) % (Math.PI * 2))
      )})`;

      if (!ref2.current) return;
      ref2.current.style.transform = `scaleY(${Math.abs(
        Math.sin((Date.now() / 250 + 1) % (Math.PI * 2))
      )})`;

      if (!ref3.current) return;
      ref3.current.style.transform = `scaleY(${Math.abs(
        Math.sin((Date.now() / 250 + 2) % (Math.PI * 2))
      )})`;

      animationFrameRef.current = requestAnimationFrame(barTick);
    }

    animationFrameRef.current = requestAnimationFrame(barTick);

    return () => {
      const animationFrame = animationFrameRef.current;
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="inline-block mr-1">
      <div
        ref={ref1}
        className="inline-block mr-px w-1 bg-gray-600 h-3 origin-bottom"
      ></div>
      <div
        ref={ref2}
        className="inline-block mr-px w-1 bg-gray-600 h-3 origin-bottom"
      ></div>
      <div
        ref={ref3}
        className="inline-block mr-px w-1 bg-gray-600 h-3 origin-bottom"
      ></div>
    </div>
  );
}
