const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Allow all for now
});

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Set up Prisma and IO on req so routes can use it without multiple imports
app.use((req, res, next) => {
  req.prisma = prisma;
  req.io = io;
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('authenticate', async (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    // Update user online status
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { online: true, lastActive: new Date() }
      });
      io.emit('user_status_change', { userId, online: true });
    } catch(err) { console.error(err); }
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { online: false, lastActive: new Date() }
        });
        io.emit('user_status_change', { userId: socket.userId, online: false });
      } catch(err) {}
    }
  });
});

// Import new aggregated API router
app.use('/api', require('./routes/api'));

// Serve static frontend in production
const path = require('path');
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
