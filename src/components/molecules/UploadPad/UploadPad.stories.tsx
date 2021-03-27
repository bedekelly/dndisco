import UploadPad from "./UploadPad";
import React from "react";

export default {
  title: "Atoms/Pad",
  component: UploadPad,
};

export const BasicUploadPad = (args: any) => <UploadPad {...args} />;
BasicUploadPad.argTypes = {
  play: { action: "play" },
  onLoadFiles: { action: "load files" },
};
