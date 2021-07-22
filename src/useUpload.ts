import getAudioFileDuration from "./audio/getAudioFileDuration";
import { apiURL } from "./components/pages/CreateSession";

type SoundID = string;
type UploadFile = (file: File) => Promise<SoundID>;

export default function useUpload(sessionID: string): UploadFile {
  return async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const duration = await getAudioFileDuration(file);
    formData.append("duration", `${duration}`);
    return fetch(`${apiURL}/upload-audio/${sessionID}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then(({ soundID }) => soundID);
  };
}
