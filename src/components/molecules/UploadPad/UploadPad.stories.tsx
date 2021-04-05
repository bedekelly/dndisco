import UploadPad from "./UploadPad";
import React from "react";

const storyConfig = {
  title: "Atoms/Pad",
  component: UploadPad,
};

export default storyConfig;

export const BasicUploadPad = (args: any) => <UploadPad {...args} />;
BasicUploadPad.argTypes = {
  play: { action: "play" },
  onLoadFiles: { action: "load files" },
};
