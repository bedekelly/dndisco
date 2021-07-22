export type Message = PlayMessage | StopMessage;
export type PlayMessage = {
  type: "play";
  soundID: string;
};
export type StopMessage = {
  type: "stop";
  soundID: string;
};
