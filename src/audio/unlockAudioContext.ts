export default async function unlock(context: AudioContext) {
  if (context.state === "running") return;
  return context.resume();
}
