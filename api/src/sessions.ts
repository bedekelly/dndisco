import { Socket } from "socket.io";

type SessionID = string;
type SoundID = string;

type Session = {
  files: SoundID[];
  host: string | null;
  sockets: Record<string, Socket>;
};
const sessions: Record<SessionID, Session> = {};

/**
 * (Create and) retrieve a session from the sessions store.
 */
export function getSession(sessionID: string): Session {
  if (!sessions[sessionID]) {
    sessions[sessionID] = { files: [], host: null, sockets: {} };
  }
  return sessions[sessionID];
}

export default sessions;
