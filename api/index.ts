import express from "express";
import http from "http";
import cors from "cors";
import connectBusboy from "connect-busboy";

import serveAudioFiles from "./src/serveAudioFiles";
import setupWebsockets from "./src/setupWebsockets";

const PORT = 1234;
const expressServer = express();
const httpServer = new http.Server(expressServer);

expressServer.use(cors());
expressServer.use(connectBusboy());

const { updateClientsAndHost } = setupWebsockets(httpServer);
serveAudioFiles(expressServer, updateClientsAndHost);

httpServer.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
