import { useEffect, useState } from "react";

export default function TextLoader() {
  const [num, setNum] = useState(0);
  const dots = ["", ".", "..", "..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setNum((oldNum: number) => (oldNum + 1) % dots.length);
    }, 110);

    return () => {
      clearInterval(interval);
    };
  }, [dots.length]);

  return <span className="absolute">{dots[num]}</span>;
}
