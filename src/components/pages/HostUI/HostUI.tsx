import React, { useMemo } from "react";

import UnlockAudio from "../../../audio/UnlockAudio";
import { useBuffers } from "../../../audio/useBuffers";
import ScreenCenter from "../../atoms/ScreenCenter";
import Visualizer from "../../molecules/Visualizer/Visualizer";

import useHostSocket from "./useHostSocket";
import VolumeSlider from "../../molecules/VolumeSlider/VolumeSlider";
import CopyableLink from "../../molecules/CopyableLink";
import StopEverything from "../../atoms/StopEverything";
import useLoadSounds from "../../../network/useLoadSounds";
import { Message, StopAllMessage } from "../../../network/messages";
import useUpload from "../../../network/useUpload";
import useSubject from "../../../subscriptions/useSubject";
import useSubscribe from "../../../subscriptions/useSubscribe";
import { filter, Observable } from "rxjs";
import usePads from "../../organisms/Pads/usePads";
import Playlist from "../../organisms/Playlist/Playlist";
import Playlists from "../../organisms/Playlists/Playlists";

type HostUIProps = {
  params: {
    sessionID: string;
  };
};

export default function HostUI({ params: { sessionID } }: HostUIProps) {
  const audio = useBuffers("host");
  const loadSounds = useLoadSounds(audio);
  const uploadFile = useUpload(sessionID);

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
    <UnlockAudio>
      <ScreenCenter>
        <div>
          <Visualizer getData={audio.getVisualizerData} />
          <VolumeSlider
            value={audio.volume}
            setValue={(vol) => audio.setVolume(vol)}
          ></VolumeSlider>
        </div>
        {/* {pads.map((pad, i) => (
          <UploadPad
            key={i}
            play={() => playPad(i)}
            stop={() => stopPad(i)}
            onLoadFile={(file) => onLoadFile(i, file)}
            fileName={pad.filename}
            loading={pad.loading}
          />
        ))}
        <button onClick={() => setPads((oldPads) => [...oldPads, makePad()])}>
          + Pad
        </button> */}
        <Playlists audio={audio} uploadFile={uploadFile} stopAll$={stopAll$} />
      </ScreenCenter>
      <CopyableLink sessionID={sessionID} />
      <StopEverything onClick={stopEverything} />
    </UnlockAudio>
  );
}
