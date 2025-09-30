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
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const cookieParser = require("cookie-parser");
const { getUserByGoogleId, getUserByEmail, createUserWithGoogle, getUserByUsername, setGoogleIdForUser } = require('./models/userModel');


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


app.use(cookieParser());


// Detect environment (default: development)
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const avatar = profile.photos?.[0]?.value || null;
        const displayName = profile.displayName || 'GoogleUser';

        // 1) try to find by google_id
        let user = await getUserByGoogleId(googleId);

        // 2) fallback: if not found, try to find existing user by email
        if (!user && email) {
          user = await getUserByEmail(email);
          if (user) {
            // link google_id to existing account if not linked yet
            if (!user.google_id) {
              try {
                await setGoogleIdForUser(user.id, googleId);
                user.google_id = googleId;
              } catch (e) {
                console.warn('Failed to set google_id for existing user:', e);
              }
            }
          }
        }

        // 3) if still not found, create a new user record
        if (!user) {
          // generate a sane username from display name, ensure uniqueness
          const base = (displayName || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9._-]/g, '') // keep simple chars
            .slice(0, 20) || `user${Date.now()}`;

          let username = base || `user${Date.now()}`;
          let suffix = 0;
          while (await getUserByUsername(username)) {
            suffix += 1;
            username = `${base}${suffix}`;
          }

          user = await createUserWithGoogle(displayName, username, email || null, googleId, avatar);
        }

        // Ensure we return a DB user object that includes `id`
        return done(null, user);
      } catch (err) {
        console.error('GoogleStrategy error:', err);
        return done(err, null);
      }
    }
  )
);



app.use(passport.initialize());



/* ---------- Middleware ---------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: isProd ? undefined : false, // disable CSP in dev
  })
);


app.use(express.json());

// CORS
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
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

// list routes (prefixes) to skip in the global limiter
const SKIP_PREFIXES = [
  "/notifications", // /api/notifications
  "/admin",         // all /api/admin/* routes
  "/support",       // /api/support/*
  // add more prefixes here as needed
];

//Prevent brute-force login or spam API calls:
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 1000, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later.' },
  skip: (req) => {
    const p = req.path || ""; // when mounted at /api, path begins with '/notifications' etc.
    return SKIP_PREFIXES.some(prefix => p.startsWith(prefix));
  },
});

app.use("/api", apiLimiter);

// More generous / tailored limiter for notifications route
const notificationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // allow a lot more requests to /api/notifications (tune as needed)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many notification requests, slow down.' },
});

// Attach per-route limiter (this will be used for requests to /api/notifications)
app.use("/api/notifications", notificationsLimiter);

//Prevent DoS via JSON
app.use(express.json({ limit: "1mb" }));


/* ---------- API Routes ---------- */
app.use("/api/auth", authRoutes);
app.use('/api', apiLimiter);

app.use("/api/users", userRoutes);
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
