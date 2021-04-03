export function STOP(oldID: string) {
  return { type: "STOP", payload: { soundID: oldID } };
}

export function LOAD(soundID: string, encodedData: ArrayBuffer) {
  return { type: "LOAD", payload: { soundID, encodedData } };
}

export function PRE_LOAD() {
  return { type: "PRE_LOAD" };
}

export function PLAY(soundID: string) {
  return { type: "PLAY", payload: { soundID } };
}

export function DELETE(soundID: string) {
  return { type: "DELETE", payload: { soundID } };
}

export function STOP_ALL() {
  return { type: "STOP_ALL" };
}
