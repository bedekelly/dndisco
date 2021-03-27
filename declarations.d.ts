declare global {
  interface window {
    webkitAudioContext: typeof AudioContext;
  }
}
