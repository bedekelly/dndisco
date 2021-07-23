import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { BigPlay, Plus, BigStop } from "../../atoms/Icons";
import TextLoader from "../../atoms/TextLoader";
import Song, { ISong } from "../../molecules/Song";
import usePlaylist, { PlaylistAudio } from "./usePlaylist";
import { StopAllMessage } from "../../../network/messages";
import { Observable } from "rxjs";
import useSubscribe from "../../../subscriptions/useSubscribe";
import ClickableInput from "../../molecules/ClickableInput/ClickableInput";

export type PlaylistProps = {
  playingID: string | null;
  songs: ISong[];
  setSongs: Dispatch<SetStateAction<ISong[]>>;
  appendFiles: (newSongs: File[]) => void;
  deleteSong: (index: number) => void;
  playSong: (songID: string) => void;
  stopSong: (songID: string) => void;
  stopPlaylist: () => void;
  loading: boolean;
  playlistName: string;
  setPlaylistName: Dispatch<SetStateAction<string>>;
};

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export default function Playlist({
  audio,
  uploadFile,
  stop$,
}: {
  audio: PlaylistAudio;
  uploadFile: any;
  stop$: Observable<StopAllMessage>;
}) {
  const {
    appendFiles,
    songs,
    setSongs,
    playingID,
    playSong,
    stopSong,
    stopPlaylist,
    deleteSong,
    loading,
    playlistName,
    setPlaylistName,
  } = usePlaylist(audio, uploadFile);
  const songList = useRef<HTMLDivElement | null>(null);
  useSubscribe(stop$, stopPlaylist);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop: appendFiles,
    accept: "audio/*",
  });

  useEffect(() => {
    if (!songList.current) return;
    if (!isDragActive) return;
    songList.current?.scroll({
      top: 10e10,
      behavior: "smooth",
    });
  }, [isDragActive]);

  function onReorderDragEnd(result: any) {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) {
      return;
    }
    setSongs(reorder(songs, result.source.index, result.destination.index));
  }

  return (
    <div
      className="text-gray-800 shadow-md rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-700 to-red-700 m-3"
      {...getRootProps()}
    >
      <div className="flex justify-between px-3 m-3 text-yellow-50">
        <h1 className="playlist-title py-2 text-2xl font-semibold w-full mr-2">
          <ClickableInput value={playlistName} setValue={setPlaylistName} />
          {loading && <TextLoader />}
        </h1>
        {!!songs.length && (
          <button
            onClick={() =>
              playingID ? stopSong(playingID) : playSong(songs[0].songID)
            }
          >
            {playingID ? <BigStop /> : <BigPlay />}
          </button>
        )}
      </div>
      <div
        className="playlist-songs mx-px mb-px w-64 h-64 sm:w-96 overflow-y-auto rounded-b-2xl"
        ref={songList}
      >
        <DragDropContext onDragEnd={onReorderDragEnd}>
          <Droppable droppableId="playlist-todo-changeme">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {songs.map(({ name, songID }, songIndex) => (
                  <Draggable
                    draggableId={songID}
                    index={songIndex}
                    key={songID}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Song
                          key={songID}
                          title={name}
                          playing={songID === playingID}
                          playSong={() => playSong(songID)}
                          stopSong={() => stopSong(songID)}
                          deleteSong={() => deleteSong(songIndex)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {isDragActive && (
          <div className="flex items-center w-full text-sm h-12 pl-3 bg-gray-200">
            <Plus />
            <span className="ml-2">Drop to add song...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export { usePlaylist };
