import React, { ReactNode } from "react";

export default function FixedWidth({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: "min(450px, 100vw)" }} className="mx-auto px-5">
      {children}
    </div>
  );
}
