export type Message = PlayMessage | StopMessage | StopAllMessage;
export type PlayMessage = {
  type: "play";
  soundID: string;
};
export type StopMessage = {
  type: "stop";
  soundID: string;
};
export type StopAllMessage = {
  type: "stopAll";
};
