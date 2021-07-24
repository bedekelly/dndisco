import React from "react";
import { Observable } from "rxjs/internal/Observable";
import { AudioControls } from "../../../audio/useBuffers";
import { StopAllMessage } from "../../../network/messages";
import TextLoader from "../../atoms/TextLoader";
import Playlist from "../Playlist/Playlist";
import usePlaylists from "./usePlaylists";

function Playlists({
  audio,
  uploadFile,
  stopAll$,
}: {
  audio: AudioControls;
  uploadFile: any;
  stopAll$: Observable<StopAllMessage>;
}) {
  const { playlists, createPlaylist, loading } = usePlaylists();
  return (
    <div>
      {playlists.map((id) => (
        <Playlist
          audio={audio}
          uploadFile={uploadFile}
          stop$={stopAll$}
          key={id}
          id={id}
        />
      ))}
      <button disabled={loading} onClick={createPlaylist}>
        + Playlist{loading && <TextLoader />}
      </button>
    </div>
  );
}

export default Playlists;
