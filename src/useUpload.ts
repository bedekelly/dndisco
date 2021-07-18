import { apiURL } from "./components/pages/CreateSession";

export default function useUpload(sessionID: string) {
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
