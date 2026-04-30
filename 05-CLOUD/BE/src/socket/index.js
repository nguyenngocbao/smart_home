const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

let _io = null;

function initSocket(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      methods: ["GET", "POST"],
    },
  });

  // Xác thực JWT khi FE kết nối
  _io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      socket.user = jwt.verify(token, env.jwt.secret);
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  _io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.user?.email}`);
    socket.join("hub-room");

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.user?.email}`);
    });
  });

  return _io;
}

function getIO() {
  if (!_io) throw new Error("Socket.io not initialized");
  return _io;
}

module.exports = { initSocket, getIO };
