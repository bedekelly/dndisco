import React from "react";

export default function ScreenCenter({ children }) {
  return (
    <div className="flex items-center justify-center h-screen content-center flex-wrap sm:flex-nowrap">
      {children}
    </div>
  );
}
