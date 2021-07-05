const app = require("express")();
const http = require("http").Server(app);
const cors = require("cors");
const { v4: uuid } = require("uuid");
const fs = require("fs-extra");
const busboy = require("connect-busboy");
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(busboy());

const PORT = 1234;

const session = {
  files: {},
  durations: {},
  clients: {},
  lastPlayed: {},
};

function getSessionFiles() {
  // console.log("Getting session files: ", session.files);
  return session.files;
}

function currentTimeSeconds() {
  const [seconds, nanos] = process.hrtime();
  return seconds + nanos / 1000_000_000;
}

const hosts = new Set();

app.post("/upload-audio", (request, response) => {
  request.pipe(request.busboy);
  request.busboy.on("file", (fieldname, file, filename) => {
    const id = uuid();
    console.log("Uploading", filename, "as", id);
    const fileStream = fs.createWriteStream("files/" + id);
    file.pipe(fileStream);
    fileStream.on("close", () => {
      console.log("Completed upload of", filename, "as", id);
      io.emit("LOAD", id);
      updateHost();
      response.send({ id });
    });
  });
});

io.on("connection", (socket) => {
  console.log("Got connection.");
  if (!(socket.id in session.clients)) {
    console.log(socket.id, session.clients);
    session.clients[socket.id] = { socket, files: [] };
  } else {
    console.log(socket.id);
    console.log(session.clients);
  }

  updateHost();

  socket.emit("INITIAL_LOAD", {
    type: "INITIAL_LOAD",
    payload: { files: getSessionFiles() },
  });

  socket.on("HI_IM_THE_HOST", () => {
    if (session.hostID !== socket.id) {
      console.log(`Host has changed (${session.hostID} => ${socket.id})`);
    }
    session.hostID = socket.id;
    hosts.add(session.hostID);
    updateHost();
  });

  socket.on("PRE_LOAD", () => {
    socket.broadcast.emit("PRE_LOAD");
  });

  socket.on("STOP", (event) => {
    console.log("Got STOP event:", event);
    socket.broadcast.emit("STOP", event);
    session.lastPlayed[event.payload.soundID] = null;
  });

  socket.on("DELETE", (event) => {
    console.log("Deleting files...");
    delete session.files[event.payload.soundID];
    delete session.lastPlayed[event.payload.soundID];
    socket.broadcast.emit("DELETE", event);
  });

  socket.on("PLAY", (event) => {
    console.log("Got message to play:", event);
    session.lastPlayed[event.payload.soundID] = currentTimeSeconds();
    socket.broadcast.emit("PLAY", event);
  });

  socket.on("STOP_ALL", () => {
    console.log("Stopping everything.");
    socket.broadcast.emit("STOP_ALL");
    for (let soundID of Object.keys(session.lastPlayed)) {
      session.lastPlayed[soundID] = null;
    }
  });

  socket.on("LOADED_FILES", (message) => {
    console.log("LOADED_FILES", { message });
    session.clients[socket.id].files = message;
    const filesToPlay = Object.entries(session.lastPlayed)
      .filter(([, value]) => value != null)
      .map(([soundID, playTime]) => [soundID, currentTimeSeconds() - playTime])
      .filter(
        ([soundID, playingFor]) => playingFor < session.durations[soundID]
      );
    socket.emit("INITIAL_PLAY", { payload: filesToPlay });
    updateHost();
  });

  socket.on("disconnect", () => {
    delete session.clients[socket.id];
    updateHost();
  });
});

const isSubsetOf = (arr1, arr2) => {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  return [...set1].every((i) => set2.has(i));
};

function updateHost() {
  if (!session.hostID) {
    console.warn("Host ID not yet present.");
    return;
  }
  console.log("Updating host:", session.hostID);
  const clients = Object.entries(session.clients);
  const sessionFiles = Object.keys(getSessionFiles());
  const filesSynced = clients.every(
    ([clientID, client]) =>
      hosts.has(clientID) || isSubsetOf(sessionFiles, client.files)
  );
  const numClients = Object.keys(session.clients).filter(
    (clientID) => !hosts.has(clientID)
  ).length;

  console.log(
    `Updating host with number of clients: ${numClients} and synced ${filesSynced}`
  );
  console.log({
    filesSynced,
    sessionFiles,
    clientFiles: Object.values(session.clients).map((c) => c.files),
  });
  io.to(session.hostID).emit("SYNC", {
    numClients,
    filesSynced,
  });
}

http.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
