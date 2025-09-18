// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");
const startCleanup = require("./scripts/cleanupMessages");
const jwt = require("jsonwebtoken");
const path = require("path");
const rateLimit = require("express-rate-limit");

// route imports
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const supportRoutes = require("./routes/supportRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();


// Detect environment (default: development)
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

/* ---------- Middleware ---------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: isProd ? undefined : false, // disable CSP in dev
  })
);


app.use(express.json());

// CORS
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);


// Serve uploads securely (no directory listing)
const uploadsPath = path.join(__dirname, "public", "uploads", "avatars");

if (!isProd) {
  // In dev: serve uploads directly
  app.use("/uploads", express.static(path.join(__dirname, "public", "uploads"), { index: false }));
} else {
  // In prod: DO NOT serve uploads directly
  console.log("🚫 Direct static serving of /uploads disabled in production");
}


// Optional health check
app.get("/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);


//Prevent brute-force login or spam API calls:
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

//Prevent DoS via JSON
app.use(express.json({ limit: "1mb" }));


/* ---------- API Routes ---------- */
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/profile", profileRoutes);

/* ---------- Error Handler ---------- */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Server error",
    ...(isProd ? {} : { error: err.message, stack: err.stack }), // hide details in prod
  });
});

/* ---------- HTTP + Socket.IO ---------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Attach io to app
app.set("io", io);

// Track online users
const onlineUsers = new Map(); // userId -> Set(socketId)

// Socket auth middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("not-authenticated"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id ?? payload.userId ?? payload.user?.id;
    if (!socket.userId) return next(new Error("invalid-token-payload"));
    next();
  } catch (err) {
    console.warn("Socket auth failed:", err.message);
    next(new Error("invalid-token"));
  }
});

// Socket connection handling
io.on("connection", (socket) => {
  const uid = socket.userId;
  if (!uid) {
    socket.disconnect(true);
    return;
  }

  // Track user sockets
  const set = onlineUsers.get(uid) || new Set();
  set.add(socket.id);
  onlineUsers.set(uid, set);

  socket.join(`user_${uid}`);
  console.log(
    `🔌 Socket connected: user=${uid} socketId=${socket.id} totalDevices=${set.size}`
  );

  socket.on("disconnect", (reason) => {
    const s = onlineUsers.get(uid);
    if (s) {
      s.delete(socket.id);
      if (s.size === 0) onlineUsers.delete(uid);
      else onlineUsers.set(uid, s);
    }
    console.log(`❌ Socket disconnected: user=${uid} reason=${reason}`);
  });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running in ${NODE_ENV} mode`);
  console.log(`✅ Listening on port ${PORT}`);
  console.log(`✅ CORS origin: ${CLIENT_ORIGIN}`);
});
