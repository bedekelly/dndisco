import { apiURL } from "./components/pages/CreateSession";

type SoundID = string;
type UploadFile = (file: File) => Promise<SoundID>;

export default function useUpload(sessionID: string): UploadFile {
  return (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${apiURL}/upload-audio/${sessionID}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then(({ soundID }) => soundID);
  };
}
