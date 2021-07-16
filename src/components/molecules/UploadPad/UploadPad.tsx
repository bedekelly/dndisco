import "./UploadPad.css";
import { useDropzone } from "react-dropzone";
import React, { useState } from "react";
import TextLoader from "../../atoms/TextLoader";

type UploadPadProps = {
  play: () => void;
  stop: () => void;
  loading: boolean;
  onLoadFile: (file: File) => void;
  fileName: string | null;
};

export default function UploadPad({
  play,
  stop,
  onLoadFile,
  fileName,
  loading,
}: UploadPadProps) {
  const [draggingOverPad, setDraggingOverPad] = useState(false);
  const {
    getRootProps,
    getInputProps,
    isDragActive: draggingOverInput,
  } = useDropzone({ onDrop, accept: "audio/*" });

  function onDrop(files: File[]) {
    if (!files[0]) return;
    setDraggingOverPad(false);
    onLoadFile(files[0]);
  }

  const dragging = draggingOverInput || draggingOverPad;
  const fullSizeInput = dragging || !fileName ? styles.fullHeight : "";
  console.log({ fileName, loading });

  return (
    <div
      className={styles.pad}
      onDragEnterCapture={() => setDraggingOverPad(true)}
      onDragLeaveCapture={() => setDraggingOverPad(false)}
    >
      <button
        className={styles.playSound}
        tabIndex={fullSizeInput ? -1 : 0}
        onClick={play}
      >
        <p className={styles.padName}>{fileName}</p>
      </button>
      {fileName && !loading && (
        <button className={styles.stop} aria-label="stop" onClick={stop}>
          <i className="block bg-white w-2.5 h-2.5 rounded-sm text-center" />
        </button>
      )}

      <button
        {...getRootProps({})}
        className={`${styles.uploadSound} ${fullSizeInput}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <>
            Loading
            <TextLoader />
          </>
        ) : dragging ? (
          <p>Drop your sound!</p>
        ) : (
          <p>Upload a sound...</p>
        )}
      </button>
    </div>
  );
}

const styles = {
  pad:
    "w-44 h-44 m-4 rounded-2xl bg-gray-200 flex justify-center items-center transition-all duration-100 shadow-md cursor-pointer flex-col relative select-none",
  playSound:
    "w-full h-5/6 bg-gradient-to-br from-blue-700 to-purple-800 rounded-t-2xl overflow-hidden absolute top-0 focus:outline-black",
  padName:
    "select-none text-center text-pink-50 font-bold text-lg overflow-ellipsis px-2 py-2",
  uploadSound: "absolute bottom-0.5 border-0 focus:outline-black",
  fullHeight:
    "full-height w-full h-full rounded-2xl bg-gradient-to-br from-blue-700 to-purple-800 font-bold text-lg text-pink-50",
  stop:
    "bg-red-400 rounded-br-2xl rounded-tl-2xl absolute top-0 left-0 w-7 h-7 flex justify-center items-center",
};
