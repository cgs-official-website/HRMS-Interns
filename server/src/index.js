import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

let PORT = parseInt(process.env.PORT || "5000", 10);
const server = http.createServer(app);

// Socket.io for live updates
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`⚡ Socket client connected: ${socket.id}`);

  socket.on("join_company", (companyId) => {
    socket.join(`company_${companyId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket client disconnected: ${socket.id}`);
  });
});

export { io };

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️ Port ${PORT} is in use. Trying port ${PORT + 1}...`);
    PORT++;
    setTimeout(() => {
      server.close();
      server.listen(PORT, () => {
        console.log(`🚀 HRMS Backend Server running on port ${PORT}`);
        console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
      });
    }, 300);
  } else {
    console.error("Server error:", err);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 HRMS Backend Server running on port ${PORT}`);
  console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
});
