const app = require("express")();
const http = require("http").Server(app);
const cors = require("cors");
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 30000,
});

app.use(cors());

const PORT = 1234;

const session = {
  files: {},
  clients: {},
};

function getSessionFiles() {
  // console.log("Getting session files: ", session.files);
  return session.files;
}

io.on("connection", (socket) => {
  console.log("Got connection.");
  session.clients[socket.id] = { socket, files: [] };
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
    updateHost();
  });

  socket.on("PRE_LOAD", () => {
    socket.broadcast.emit("PRE_LOAD");
  });

  socket.on("LOAD", (message) => {
    console.log("Got file to load:", message.payload.soundID);
    session.files[message.payload.soundID] = message.payload.encodedData;
    socket.broadcast.emit("LOAD", message);
  });

  socket.on("STOP", (event) => {
    console.log("Got STOP event:", event);
    socket.broadcast.emit("STOP", event);
  });

  socket.on("DELETE", (event) => {
    console.log("Deleting files...");
    delete session.files[event.payload.soundID];
    socket.broadcast.emit("DELETE", event);
  });

  socket.on("PLAY", (event) => {
    console.log("Got message to play:", event);
    socket.broadcast.emit("PLAY", event);
  });

  socket.on("STOP_ALL", () => {
    console.log("Stopping everything.");
    socket.broadcast.emit("STOP_ALL");
  });

  socket.on("LOADED_FILES", (message) => {
    console.log("Loaded files:");
    console.log(message);
    session.clients[socket.id].files = message;
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
      clientID === session.hostID || isSubsetOf(sessionFiles, client.files)
  );
  const numClients = clients.filter(([clientID]) => clientID !== session.hostID)
    .length;
  io.to(session.hostID).emit("SYNC", {
    numClients,
    filesSynced,
  });
}

http.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
