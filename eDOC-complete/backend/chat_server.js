const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve all HTML files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Track who is currently in the video room
const roomMembers = []; // { id, role }

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // ── VIDEO: someone joined the video page ──────────────────────────────
  socket.on("video-joined", (data) => {
    // Remove any old entry for this socket
    const existing = roomMembers.findIndex(m => m.id === socket.id);
    if (existing !== -1) roomMembers.splice(existing, 1);
    roomMembers.push({ id: socket.id, role: data.role });

    // Tell everyone else this person joined
    socket.broadcast.emit("video-joined", data);

    // Tell this new joiner about everyone already in the room
    roomMembers
      .filter(m => m.id !== socket.id)
      .forEach(m => socket.emit("video-joined", { role: m.role }));
  });

  // ── INCOMING CALL RING: patient clicks "Start Video Call" from chat ───
  socket.on("call-ringing", (data) => {
    socket.broadcast.emit("call-ringing", data);
  });

  // ── Patient cancelled ringing before doctor answered ──────────────────
  socket.on("call-cancelled", () => {
    socket.broadcast.emit("call-cancelled");
  });

  // ── Doctor responded to ringing ───────────────────────────────────────
  socket.on("call-accepted", () => socket.broadcast.emit("call-accepted"));
  socket.on("call-declined",  () => socket.broadcast.emit("call-declined"));

  // ── WebRTC signaling relay ─────────────────────────────────────────────
  socket.on("webrtc-offer",          (d) => socket.broadcast.emit("webrtc-offer", d));
  socket.on("webrtc-answer",         (d) => socket.broadcast.emit("webrtc-answer", d));
  socket.on("webrtc-ice-candidate",  (d) => socket.broadcast.emit("webrtc-ice-candidate", d));

  // ── Call ended ─────────────────────────────────────────────────────────
  socket.on("call-ended", (d) => socket.broadcast.emit("call-ended", d));

  // ── Chat messages ──────────────────────────────────────────────────────
  socket.on("chat message", (msg) => io.emit("chat message", msg));

  socket.on("disconnect", () => {
    const idx = roomMembers.findIndex(m => m.id === socket.id);
    if (idx !== -1) roomMembers.splice(idx, 1);
    console.log("Disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("✅ eDOC server running → http://localhost:5000");
  console.log("   Patient: http://localhost:5000/livechat.html");
  console.log("   Doctor:  http://localhost:5000/livechat_doc.html");
});
