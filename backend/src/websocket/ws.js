const WebSocket = require('ws');

// Store active connections per match
const matchConnections = new Map();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const matchId = url.searchParams.get('matchId');

    if (!matchId) {
      ws.close(1008, 'matchId required');
      return;
    }

    // Register connection for this match
    if (!matchConnections.has(matchId)) {
      matchConnections.set(matchId, new Set());
    }
    matchConnections.get(matchId).add(ws);

    console.log(`Client connected to match ${matchId}. Total: ${matchConnections.get(matchId).size}`);

    // Send audience count
    broadcastToMatch(matchId, {
      type: 'audience_count',
      count: matchConnections.get(matchId).size,
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(matchId, ws, message);
      } catch (e) {
        console.error('Invalid message:', e.message);
      }
    });

    ws.on('close', () => {
      const connections = matchConnections.get(matchId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          matchConnections.delete(matchId);
        } else {
          broadcastToMatch(matchId, {
            type: 'audience_count',
            count: connections.size,
          });
        }
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });
  });

  return wss;
}

function handleMessage(matchId, senderWs, message) {
  switch (message.type) {
    case 'ball_event':
      // Scorer sends a ball event → broadcast to all audience
      broadcastToMatch(matchId, {
        type: 'ball_event',
        data: message.data,
      }, senderWs);
      break;

    case 'score_update':
      // Full score snapshot → broadcast to all audience
      broadcastToMatch(matchId, {
        type: 'score_update',
        data: message.data,
      }, senderWs);
      break;

    case 'innings_end':
      broadcastToMatch(matchId, {
        type: 'innings_end',
        data: message.data,
      }, senderWs);
      break;

    case 'match_end':
      broadcastToMatch(matchId, {
        type: 'match_end',
        data: message.data,
      }, senderWs);
      break;

    case 'undo':
      broadcastToMatch(matchId, {
        type: 'undo',
        data: message.data,
      }, senderWs);
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

function broadcastToMatch(matchId, message, excludeWs = null) {
  const connections = matchConnections.get(matchId);
  if (!connections) return;

  const data = JSON.stringify(message);
  for (const ws of connections) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

module.exports = { setupWebSocket, broadcastToMatch };
