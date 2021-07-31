import React, { useState } from "react";
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
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="mt-10">
      {loading && (
        <>
          Loading Playlists
          <TextLoader />
        </>
      )}
      {playlists.map((id) => (
        <Playlist
          audio={audio}
          expanded={expanded === id}
          toggleExpanded={() => {
            setExpanded((oldID) => (id === oldID ? null : id));
          }}
          uploadFile={uploadFile}
          stop$={stopAll$}
          key={id}
          id={id}
        />
      ))}
      <button
        className="w-full bg-gradient-to-br from-yellow-700 to-red-600 rounded-2xl px-3 py-3 text-yellow-50 font-semibold text-xl"
        disabled={loading}
        onClick={() => createPlaylist().then((id) => setExpanded(id))}
      >
        + Playlist
      </button>
    </div>
  );
}

export default Playlists;
