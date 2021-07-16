import { Socket } from "socket.io";

type SessionID = string;
type SoundID = string;

type Session = {
  files: SoundID[];
  host: string | null;
  clientFiles: Record<string, SoundID[]>;
  sockets: Record<string, Socket>;
  sessionID: string;
};

const sessions: Record<SessionID, Session> = {};

/**
 * Create a new, empty session.
 */
function makeSession(sessionID: string): Session {
  return {
    files: ["3164ed33-f7c1-49df-a9bf-12f6aac4dbf5"],
    host: null,
    sockets: {},
    clientFiles: {},
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
