import { Delete, Play, Stop } from "../atoms/Icons";
import MiniVisualiser from "../atoms/MiniVisualiser";

export type ISong = {
  songID: string;
  name: string;
};

export default function Song({
  playing = false,
  title,
  playSong,
  stopSong,
  deleteSong,
  disabled = false,
}: {
  playing?: boolean;
  title: string;
  playSong: () => void;
  stopSong: () => void;
  deleteSong: () => void;
  disabled?: boolean;
}) {
  const playingStyles = playing ? "font-bold" : "";
  return (
    <div
      className={`song border-b bg-gray-50 border-yellow-50 border ${playingStyles} transition duration-100 hover:bg-gray-100 w-full h-12 flex content-center items-center pl-3 cursor-default`}
    >
      <button
        className="cursor-pointer mr-2"
        onClick={() => !disabled && (playing ? stopSong() : playSong())}
      >
        {!disabled && (playing ? <Stop /> : <Play />)}
        {disabled && "—"}
      </button>
      <div className="text-sm flex-grow whitespace-nowrap overflow-hidden truncate">
        {playing && <MiniVisualiser />}
        {title}
      </div>
      <button
        onClick={() => !disabled && deleteSong()}
        className="cursor-pointer mr-2 text-red-700"
      >
        <Delete />
      </button>
    </div>
  );
}
