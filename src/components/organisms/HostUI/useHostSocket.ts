import { useEffect } from "react";
import globalSocket from "../../../globalSocket";

export default function useHostSocket(sessionID: string) {
  useEffect(() => {
    console.log("saying hello");
    globalSocket.emit("hostHello", sessionID, (files: any) => {
      console.log("got reply", { files });
    });
    return () => {
      globalSocket.close();
    };
  }, [sessionID]);
}
