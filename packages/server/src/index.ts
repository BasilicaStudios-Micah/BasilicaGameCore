// ============================================================
// BasilicaGameCore — Server Entry Point
// BasilicaStudiosLLC
// ============================================================

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { API_PREFIX, WS_EVENTS, ENGINE_NAME, ENGINE_VERSION } from '@basilica/shared';

import roomsRouter from './routes/rooms';
import boardsRouter from './routes/boards';
import cardsRouter from './routes/cards';
import diceRouter from './routes/dice';
import scriptRouter from './routes/script';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { roomManager } from './game-engine/room-manager';
import { store } from './utils/store';

const PORT = process.env.PORT ?? 3001;

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.IO ──────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('room:join', ({ roomId, playerId }: { roomId: string; playerId: string }) => {
    socket.join(roomId);
    const room = roomManager.setPlayerConnection(roomId, playerId, true);
    if (room) io.to(roomId).emit(WS_EVENTS.ROOM_UPDATED, room);
    console.log(`[WS] Player ${playerId} joined room ${roomId}`);
  });

  socket.on('room:leave', ({ roomId, playerId }: { roomId: string; playerId: string }) => {
    socket.leave(roomId);
    const room = roomManager.setPlayerConnection(roomId, playerId, false);
    if (room) io.to(roomId).emit(WS_EVENTS.ROOM_UPDATED, room);
  });

  socket.on('game:action', ({ roomId, action, payload }: any) => {
    // Broadcast action to all players in room
    socket.to(roomId).emit(WS_EVENTS.ACTION_SUBMITTED, { action, payload });
  });

  socket.on('dice:roll', ({ roomId, result }: any) => {
    io.to(roomId).emit(WS_EVENTS.DICE_ROLLED, result);
  });

  socket.on('chat:message', ({ roomId, playerId, message }: any) => {
    io.to(roomId).emit(WS_EVENTS.CHAT_MESSAGE, {
      playerId,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ─────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    engine: ENGINE_NAME,
    version: ENGINE_VERSION,
    uptime: process.uptime(),
    store: store.stats(),
  });
});

app.use(`${API_PREFIX}/rooms`, roomsRouter);
app.use(`${API_PREFIX}/boards`, boardsRouter);
app.use(`${API_PREFIX}/cards`, cardsRouter);
app.use(`${API_PREFIX}/dice`, diceRouter);
app.use(`${API_PREFIX}/script`, scriptRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║         BasilicaGameCore  v${ENGINE_VERSION}            ║
║         by BasilicaStudiosLLC                ║
╠══════════════════════════════════════════════╣
║  HTTP   → http://localhost:${PORT}              ║
║  WS     → ws://localhost:${PORT}                ║
║  Health → http://localhost:${PORT}/health       ║
╚══════════════════════════════════════════════╝
  `);
});

export { io };
