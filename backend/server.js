const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { authMiddlewareSocket } = require('./middleware/authMiddlewareSocket');

const { sendMessageSocket } = require('./controllers/messageController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// make io available to route handlers (so req.io can be used)
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.io auth + messaging
io.use(authMiddlewareSocket);

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  // auto-join if auth middleware attached userId
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    console.log(`Auto-joined user_${socket.userId}`);
  }

  // still allow explicit join if frontend emits it
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('send_message', async (msg) => {
    try {
      // use helper that persists message and emits to rooms
      await sendMessageSocket(io, msg);
    } catch (err) {
      console.error('Socket send_message handler error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅Server running on port ${PORT}`));
