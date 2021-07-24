type SoundID = string;

export type Playlist = {
  currentlyPlaying: null | {
    soundID: SoundID;
    startedAt: number;
    offset?: number;
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
