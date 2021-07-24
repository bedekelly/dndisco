type SoundID = string;

export type Playlist = {
  currentlyPlaying: null | {
    soundID: SoundID;
    playedAt: number;
  };
  entries: SoundID[];
  name: string;
};

export function makePlaylist(): Playlist {
  return {
    currentlyPlaying: null,
    entries: [],
    name: "New Playlist",
  };
}
