import _ from "lodash";
import { performance } from "perf_hooks";
import { Socket } from "socket.io";

type SessionID = string;
type SoundID = string;

export type Session = {
  files: SoundID[];
  host: string | null;
  clientFiles: Record<string, SoundID[]>;
  sockets: Record<string, Socket>;
  sessionID: string;
  durations: Record<SoundID, number>;
  playing: Record<SoundID, number>;
};

const sessions: Record<SessionID, Session> = {};

/**
 * Create a new, empty session.
 */
function makeSession(sessionID: string): Session {
  return {
    files: [],
    host: null,
    sockets: {},
    clientFiles: {},
    durations: {},
    playing: {},
    sessionID,
  };
}

/**
 * (Create and) retrieve a session from the sessions store.
 */
export function getSession(sessionID: string): Session {
  if (!sessions[sessionID]) {
    sessions[sessionID] = makeSession(sessionID);
  }
  return sessions[sessionID];
}

export default sessions;

export function getPlayingSounds(session: Session) {
  session.playing = _.pickBy(session.playing, (lastPlayedTime, soundID) => {
    const now = performance.now();
    return now - lastPlayedTime < session.durations[soundID];
  });
  return _.mapValues(
    session.playing,
    (timestamp) => performance.now() - timestamp
  );
}
