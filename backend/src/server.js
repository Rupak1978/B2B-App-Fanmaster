const express = require('express');
const http = require('http');
const cors = require('cors');
const { setupWebSocket } = require('./websocket/ws');
const matchRoutes = require('./routes/matches');
const teamRoutes = require('./routes/teams');
const tournamentRoutes = require('./routes/tournaments');
const ballEventRoutes = require('./routes/ball-events');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'CricLive', version: '1.0.0' });
});

// API routes
app.use('/api/matches', matchRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/ball-events', ballEventRoutes);

// WebSocket for live audience
setupWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`CricLive server running on port ${PORT}`);
  console.log(`WebSocket available on ws://localhost:${PORT}/ws`);
});

module.exports = { app, server };
