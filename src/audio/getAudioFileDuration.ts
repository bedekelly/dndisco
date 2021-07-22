function loadAsDataURL(file: File): Promise<string> {
  const reader = new FileReader();
  const completed = new Promise<string>((resolve) => {
    reader.onload = (event) => {
      if (!event?.target) return;
      resolve(event.target.result as string);
    };
  });
  reader.readAsDataURL(file);
  return completed;
}

/**
 * Given a data URL, returns the audio element's duration in MS.
 */
function getDurationFromURL(url: string) {
  const audioElement = document.createElement("audio");
  audioElement.src = url;
  return new Promise((resolve) => {
    audioElement.onloadedmetadata = () => resolve(audioElement.duration * 1000);
  });
}

/**
 * Get an audio file's duration in MS.
 * Note: this takes ~200ms so not a huge performance concern.
 */
export default async function getAudioFileDurationMS(file: File) {
  const dataURL = await loadAsDataURL(file);
  return getDurationFromURL(dataURL);
}
