import React from "react";
import { Observable } from "rxjs/internal/Observable";
import { StopAllMessage } from "../../../network/messages";
import TextLoader from "../../atoms/TextLoader";
import Playlist from "../Playlist/Playlist";
import { PlaylistAudio } from "../Playlist/usePlaylist";
import usePlaylists from "./usePlaylists";

function Playlists({
  audio,
  uploadFile,
  stopAll$,
}: {
  audio: PlaylistAudio;
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
