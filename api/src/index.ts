import express from "express";
import http from "http";
import cors from "cors";
import connectBusboy from "connect-busboy";

import setupAPI from "./setupAPI";
import setupWebsockets from "./setupWebsockets";

const PORT = 1234;
const expressServer = express();
const httpServer = new http.Server(expressServer);

expressServer.use(cors());
expressServer.use(connectBusboy());

const { updateClientsAndHost } = setupWebsockets(httpServer);
setupAPI(expressServer, updateClientsAndHost);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on *:${PORT}`);
});
