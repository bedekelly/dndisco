/**
 * Requirements for playlists:
 * - Show a list of songs
 * - Show which one is playing
 * - Songs have a delete button
 * - Drag'n'drop new files anywhere in the list
 * - Clicking a song will skip to it
 */
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { BigPlay, Plus, BigStop } from "../../atoms/Icons";
import TextLoader from "../../atoms/TextLoader";
import Song, { ISong } from "../../molecules/Song";
import usePlaylist from "./usePlaylist";

export type PlaylistProps = {
  playingID: string | null;
  songs: ISong[];
  setSongs: Dispatch<SetStateAction<ISong[]>>;
  appendFiles: (newSongs: File[]) => void;
  deleteSong: (index: number) => void;
  playSong: (songID: string) => void;
  stopSong: (songID: string) => void;
  loading: boolean;
};

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export default function Playlist({
  playingID,
  songs,
  setSongs,
  appendFiles,
  deleteSong,
  playSong,
  stopSong,
  loading,
}: PlaylistProps) {
  const songList = useRef<HTMLDivElement | null>(null);

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
    console.log({ songs, result });
    if (!result.destination) return;
    if (result.destination.index === result.source.index) {
      return;
    }
    setSongs(reorder(songs, result.source.index, result.destination.index));
  }

  return (
    <div
      className="text-gray-800 shadow-md rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-700 to-red-700"
      {...getRootProps()}
    >
      <div className="flex justify-between px-3 m-3 text-yellow-50">
        <h1 className="plaaylist-title py-2 text-2xl font-semibold">
          Tension Jazz
          {loading && <TextLoader />}
        </h1>
        <button
          onClick={() =>
            playingID ? stopSong(playingID) : playSong(songs[0].songID)
          }
        >
          {!!songs.length && (playingID ? <BigStop /> : <BigPlay />)}
        </button>
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
