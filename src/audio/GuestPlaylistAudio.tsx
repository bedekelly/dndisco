import { MutableRefObject } from "react";
import globalSocket from "../network/globalSocket";
import { loadSounds } from "../network/useLoadSounds";
import { AudioControls } from "./useBuffers";

type SoundID = string;
type PlaylistEntry = {
  soundID: string;
  name: string;
};

type PlaylistData = {
  currentlyPlaying: null | {
    soundID: SoundID;
    offset: number;
  };
  entries: PlaylistEntry[];
  name: string;
};

//                   = [onLoading , onLoaded  ];
export type LoadingTriggers = [() => void, () => void];

export default class PlaylistAudio {
  audio: MutableRefObject<AudioControls>;
  playlistData: PlaylistData;
  playingID: string | null = null;

  constructor(
    audio: MutableRefObject<AudioControls>,
    playlistData: PlaylistData,
    [onLoading, onLoaded]: LoadingTriggers
  ) {
    this.audio = audio;
    this.playlistData = playlistData;

    const startTime = performance.now();
    onLoading();
    loadSounds(
      playlistData.entries.map((entry) => entry.soundID),
      audio.current
    ).then(() => {
      this.startPlaying((performance.now() - startTime) / 1000);
      onLoaded();
      globalSocket.emit("gotFiles", audio.current.getLoadedSounds());
    });
  }

  async updatePlaylistData([onLoading, onLoaded]: LoadingTriggers) {
    const start = performance.now();
    onLoading();
    const soundIDs = this.playlistData.entries.map((entry) => entry.soundID);
    await loadSounds(soundIDs, this.audio.current);
    onLoaded();
    globalSocket.emit("gotFiles", this.audio.current.getLoadedSounds());

    const serverCurrentlyPlaying =
      this.playlistData.currentlyPlaying?.soundID || null;
    const ourCurrentlyPlaying = this.playingID;

    const loadingTimeSeconds = (performance.now() - start) / 1000;

    if (ourCurrentlyPlaying && !serverCurrentlyPlaying) {
      this.stop();
    } else if (serverCurrentlyPlaying !== ourCurrentlyPlaying) {
      this.startPlaying(loadingTimeSeconds);
    }
  }

  async stop() {
    if (this.playingID != null) this.audio.current.stopBuffer(this.playingID);
    this.playingID = null;
  }

  async playSong(songID: string, offset: number = 0) {
    if (this.playingID) {
      this.stop();
    }
    this.playingID = songID;

    const audio = this.audio.current;
    await this.audio.current.playBufferAtOffset(songID, offset);

    audio.onCompleted(songID).then(async () => {
      const currentlyPlaying = this.playingID;

      // Check if song was manually stopped or another track was chosen.
      if (currentlyPlaying !== songID) return;

      // Here, we know that the track has finished organically.
      const playlist = this.playlistData.entries;
      const thisSongIndex = playlist?.findIndex(
        (track) => track.soundID === currentlyPlaying
      );

      if (
        !playlist || // Playlist doesn't exist (somehow?)
        thisSongIndex == null || // Can't find this song any more (somehow?)
        thisSongIndex >= playlist.length - 1 // Song is at the end of the playlist.
      ) {
        this.playingID = null;
      } else {
        // Use a setTimeout here so we don't recurse to arbitrary depth with playlists.
        setTimeout(() => {
          const nextSong = playlist[thisSongIndex + 1].soundID;
          this.playSong(nextSong, 0);
        }, 0);
      }
    });
  }

  async startPlaying(loadingOffset: number) {
    const start = performance.now();
    const playlist = this.playlistData;
    if (!playlist || !playlist.currentlyPlaying) return;

    let { offset: serverOffset, soundID } = playlist.currentlyPlaying;
    serverOffset = (serverOffset || 0) / 1000;
    let totalOffset = serverOffset + loadingOffset;

    let playlistFinished = false;
    const audio = this.audio.current;

    while (totalOffset >= audio.durations[soundID]) {
      totalOffset -= audio.durations[soundID];

      const playlistTracks = this.playlistData.entries;
      let soundIndex = playlistTracks.findIndex(
        // eslint-disable-next-line no-loop-func
        (song) => song.soundID === soundID
      );

      // Check if there's a next track up, or if the playlist has finished!
      // Todo: check this logic is correct if we're halfway through the last song.
      if (!playlistTracks[soundIndex + 1]) {
        playlistFinished = true;
        break;
      }
      soundID = playlistTracks[soundIndex + 1].soundID;
    }

    if (playlistFinished) return;

    const end = performance.now();
    const processingOffset = (end - start) / 1000;

    this.playSong(soundID, totalOffset + processingOffset);
  }

  async cleanUp() {
    this.stop();
  }
}
