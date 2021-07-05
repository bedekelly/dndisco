import { useEffect } from "react";
import { useMemo } from "react";
import socketIO from "socket.io-client";
export const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL?.replaceAll('"', "") || "";

const socket = socketIO(SOCKET_SERVER_URL);

const loadedFiles = {};

export default function TestUI() {
  // const globalSocket = useMemo(() => {
  //   const globalSocket = socketIO(SOCKET_SERVER_URL);
  //   globalSocket.emit("clientHello", "sessionID123");
  //   let loadedFiles = {};

  //   globalSocket.on("filesUpdate", async (files: string[]) => {
  //     console.log("filesUpdate");
  //     console.log({ files });
  //     const fileDownloads = [];

  //     for (let file of files) {
  //       if (!(file in loadedFiles)) {
  //         fileDownloads.push(
  //           fetch(`${SOCKET_SERVER_URL}/files/${file}`, {
  //             cache: "force-cache",
  //           })
  //         );
  //       }
  //     }

  //     const fileDownloadResults = await Promise.allSettled(fileDownloads);
  //     console.log({ fileDownloadResults });
  //   });
  //   return globalSocket;
  // }, []);

  useEffect(() => {
    socket.on("filesUpdate", async (files: string[]) => {
      console.log("filesUpdate");
      console.log({ files });

      const fileDownloads = [];
      for (let file of files) {
        if (!(file in loadedFiles)) {
          fileDownloads.push(
            fetch(`${SOCKET_SERVER_URL}/files/${file}`, {
              cache: "force-cache",
            })
          );
        }
      }
      const fileDownloadResults = await Promise.allSettled(fileDownloads);
      console.log({ fileDownloadResults });
    });

    socket.emit("clientHello", "sessionID123");
  }, []);

  return <h1>Testing Guest</h1>;
}
