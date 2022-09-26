const express = require("express");
var mongoose = require("mongoose");
const app = express();
const http = require("http");
const path = require("path");
const { Server } = require("socket.io"); //made class named Server
const ACTIONS = require("./src/actions/SocketActions");

const server = http.createServer(app); //created server
const io = new Server(server); //created instance of Server class

const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.Promise = global.Promise;
mongoose.connect(
  "mongodb+srv://jay:NX1NHJ6Cw2Y6UKOd@cluster0.hgdr883.mongodb.net/?retryWrites=true&w=majority"
);

//schema
var roomCreatorSchema = new mongoose.Schema({
  roomId: String,
  roomCreator: String,
});

var RoomCreator = mongoose.model("RoomCreator", roomCreatorSchema);

app.post("/createRoom", (req, res) => {
  var data = new RoomCreator(req.body);
  data
    .save()
    .then((item) => {
      res.status(200).send(item);
    })
    .catch((err) => {
      res.status(400).send("unable to save to database", err);
    });
});

app.get("/checkCreator/:roomId", (req, res) => {
  RoomCreator.find({ roomId: req.params.roomId })
    .then((item) => {
      res.status(200).send(item);
    })
    .catch((err) => {
      res.status(400).send("unable to find the data", err);
    });
});

app.use(express.static("build"));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    let isRoomCreator = false;
    if (Object.keys(userSocketMap).length === 1) {
      isRoomCreator = true;
    }
    socket.join(roomId);
    socket.emit(ACTIONS.NAVIGATE_USER);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
        isRoomCreator,
      });
    });
  });

  socket.on(ACTIONS.CODING_LANGUAGE_CHANGE, ({ roomId, sl }) => {
    socket.in(roomId).emit(ACTIONS.CODING_LANGUAGE_CHANGE, { sl });
  });

  //For video conferencing
  socket.on("start_call", ({ roomId, username, localStream }) => {
    console.log(`Broadcasting start_call event to peers in room ${roomId}`);
    // io.to(roomId).emit("start_call", { username });
    socket.broadcast
      .to(roomId)
      .emit("start_call", { username, uLocalStream: localStream });
  });

  socket.on("webrtc_offer", (event) => {
    console.log(
      `Broadcasting webrtc_offer event to peers in room ${event.roomId}`
    );
    socket.broadcast.to(event.roomId).emit("webrtc_offer", event.sdp);
  });
  socket.on("webrtc_answer", (event) => {
    console.log(
      `Broadcasting webrtc_answer event to peers in room ${event.roomId}`
    );
    socket.broadcast.to(event.roomId).emit("webrtc_answer", event.sdp);
  });
  socket.on("webrtc_ice_candidate", (event) => {
    console.log(
      `Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`
    );
    socket.broadcast.to(event.roomId).emit("webrtc_ice_candidate", event);
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, value, username }) => {
    socket.broadcast.to(roomId).emit(ACTIONS.CODE_CHANGE, { value });
    // io.to(roomId).emit(ACTIONS.CODE_CHANGE, { value });
    io.to(roomId).emit(ACTIONS.UPDATE_WRITER, { username });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  //Whiteboard
  socket.on("drawing", ({ data }) => {
    // console.log("broadcasting data for drawing", data);
    socket.broadcast.emit("drawing", { data });
  });

  socket.on("undoRedo", ({ roomId, trackObj }) => {
    io.to(roomId).emit("undoRedo", { trackObj });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
