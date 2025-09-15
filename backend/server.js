
// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// route imports (make sure these files exist as per previous steps)
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Basic middleware
app.use(helmet());
app.use(express.json());

// CORS: allow your client origin (set CLIENT_ORIGIN in .env)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

// Optional health check
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// API routes (prefix with /api)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);


// Generic error handler (simple)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});

/* ---------- HTTP + Socket.IO setup ---------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  // optional transports config:
  transports: ['websocket', 'polling']
});

// expose io to controllers via app.get('io')
app.set('io', io);

// Keep track of connected sockets per user (optional, helpful)
const onlineUsers = new Map(); // userId -> Set(socketId)

// Socket auth middleware: expects client to connect with { auth: { token } }
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('not-authenticated'));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // attach to socket
    socket.userId = payload.id ?? payload.userId ?? payload.user?.id;
    if (!socket.userId) return next(new Error('invalid-token-payload'));

    return next();
  } catch (err) {
    console.warn('Socket auth failed:', err.message);
    return next(new Error('invalid-token'));
  }
});

io.on('connection', (socket) => {
  const uid = socket.userId;
  if (!uid) {
    // precaution
    socket.disconnect(true);
    return;
  }

  // record socket
  const set = onlineUsers.get(uid) || new Set();
  set.add(socket.id);
  onlineUsers.set(uid, set);

  // join user room
  socket.join(`user_${uid}`);

  console.log(`Socket connected: user=${uid} socketId=${socket.id} totalDevices=${set.size}`);

  // optional: handle incoming client socket events (if you want)
  socket.on('disconnect', (reason) => {
    const s = onlineUsers.get(uid);
    if (s) {
      s.delete(socket.id);
      if (s.size === 0) onlineUsers.delete(uid);
      else onlineUsers.set(uid, s);
    }
    console.log(`Socket disconnected: user=${uid} socketId=${socket.id} reason=${reason}`);
  });

  // If you want to allow clients to emit messages through socket (instead of REST),
  // add handlers here similar to your REST controllers. Example:
  // socket.on('private_message', async (payload, ack) => { ... })
});

/* ---------- Start server ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`✅ CORS origin: ${CLIENT_ORIGIN}`);
});


