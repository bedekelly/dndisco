import React, { useMemo } from "react";

import UnlockAudio from "../../../audio/UnlockAudio";
import { useBuffers } from "../../../audio/useBuffers";
import Visualizer from "../../molecules/Visualizer/Visualizer";

import useHostSocket from "./useHostSocket";
import CopyableLink from "../../molecules/CopyableLink";
import StopEverything from "../../atoms/StopEverything";
import useLoadSounds from "../../../network/useLoadSounds";
import { Message, StopAllMessage } from "../../../network/messages";
import useUpload from "../../../network/useUpload";
import useSubject from "../../../subscriptions/useSubject";
import useSubscribe from "../../../subscriptions/useSubscribe";
import { filter, Observable } from "rxjs";
import usePads, { makePad } from "../../organisms/Pads/usePads";
import Playlists from "../../organisms/Playlists/Playlists";
import UploadPad from "../../molecules/UploadPad/UploadPad";
import NetworkIndicator from "../../atoms/NetworkIndicator";
import useServerStats from "../../../network/useServerStats";
import FixedWidth from "../../atoms/FixedWidth";

type HostUIProps = {
  params: {
    sessionID: string;
  };
};

export default function HostUI({ params: { sessionID } }: HostUIProps) {
  const audio = useBuffers("host");
  const loadSounds = useLoadSounds(audio);
  const uploadFile = useUpload(sessionID);
  const { isSynced, numberClients, isConnected } = useServerStats();

  const messages$ = useSubject<Message>();
  const stopAll$ = useMemo(
    () =>
      messages$.pipe(
        filter((message) => message.type === "stopAll")
      ) as Observable<StopAllMessage>,
    [messages$]
  );

  const {
    pads,
    setPads,
    playPad,
    stopPad,
    onLoadFile,
    onServerFiles,
  } = usePads(audio, uploadFile, loadSounds, messages$);

  const { serverFiles$ } = useHostSocket(
    sessionID,
    messages$,
    audio,
    pads,
    setPads
  );
  useSubscribe(serverFiles$, onServerFiles);

  function stopEverything() {
    messages$.next({ type: "stopAll" });
    audio.stopAll();
  }

  return (
    <>
      <UnlockAudio>
        <NetworkIndicator
          connected={isConnected}
          synced={isSynced}
          numberClients={numberClients}
        />
        <div className="absolute top-0 right-0">
          <StopEverything onClick={stopEverything} />
        </div>
        <FixedWidth>
          <Visualizer size="small" getData={audio.getVisualizerData} />
          <CopyableLink sessionID={sessionID} />
          <Playlists
            audio={audio}
            uploadFile={uploadFile}
            stopAll$={stopAll$}
          />
          <div className="pads mt-10 flex flex-wrap justify-around">
            {pads.map((pad, i) => (
              <UploadPad
                key={i}
                play={() => playPad(i)}
                stop={() => stopPad(i)}
                onLoadFile={(file) => onLoadFile(i, file)}
                fileName={pad.filename}
                loading={pad.loading}
              />
            ))}
            <button
              className="w-36 h-36 sm:w-44 sm:h-44  mr-4 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-red-400 text-white font-bold text-xl leading-tight grid place-items-center"
              onClick={() => setPads((oldPads) => [...oldPads, makePad()])}
            >
              <span className="flex items-center">
                <span className="text-3xl mr-1.5">+</span>
                <span className="mt-2">Pad</span>
              </span>
            </button>
          </div>
          {/* <ScreenCenter></ScreenCenter> */}
        </FixedWidth>
      </UnlockAudio>
    </>
  );
}
