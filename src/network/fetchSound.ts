import { apiURL } from "./api";

/**
 * Fetch a sound ID from the server, returning an arraybuffer.
 */
const fetchSound = (soundID: string) =>
  fetch(`${apiURL}/files/${soundID}`).then((response) =>
    response.arrayBuffer()
  );

export default fetchSound;
