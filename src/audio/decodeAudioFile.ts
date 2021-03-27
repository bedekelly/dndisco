type DecodingInfo = {
  encodedData: ArrayBuffer;
  decodedData: AudioBuffer;
};

export default async function decodeAudioFile(
  context: AudioContext,
  newSoundFile: File
): Promise<DecodingInfo> {
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const encodedData = event.target?.result as ArrayBuffer | null;
      if (!encodedData) return;
      // Copy the encoded data so we can reuse it.
      context.decodeAudioData(encodedData.slice(0), (decodedData) =>
        resolve({ encodedData, decodedData })
      );
    };
    reader.readAsArrayBuffer(newSoundFile);
  });
}
