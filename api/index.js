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
};

function getSessionFiles() {
  console.log("Getting session files: ", session.files);
  return session.files;
}

io.on("connection", (socket) => {
  console.log("Got connection.");

  socket.emit("INITIAL_LOAD", {
    type: "INITIAL_LOAD",
    payload: { files: getSessionFiles() },
  });

  socket.on("LOAD", (message) => {
    console.log("Got file to load:", message);
    session.files[message.payload.soundID] = message.payload.encodedData;
    socket.broadcast.emit("LOAD", message);
  });

  socket.on("PLAY", (message) => {
    console.log("Got message to play:", message);
    socket.broadcast.emit("PLAY", message);
  });
});

http.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
