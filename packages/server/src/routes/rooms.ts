import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { roomManager } from '../game-engine/room-manager';
import { store } from '../utils/store';
import { generateId } from '@basilica/shared';
import type { Player } from '@basilica/shared';

const router = Router();

const CreateRoomSchema = z.object({
  name: z.string().min(1).max(64),
  playerName: z.string().min(2).max(32),
  maxPlayers: z.number().int().min(1).max(16).optional(),
  gameDefId: z.string().optional(),
});

const JoinRoomSchema = z.object({
  code: z.string().length(6),
  playerName: z.string().min(2).max(32),
  playerId: z.string().optional(),
});

/** GET /api/v1/rooms — list all waiting rooms */
router.get('/', (_req: Request, res: Response) => {
  const rooms = store.getAllRooms().filter(r => r.status === 'waiting');
  res.json({ success: true, data: rooms });
});

/** GET /api/v1/rooms/:id */
router.get('/:id', (req: Request, res: Response) => {
  const room = store.getRoomById(req.params.id);
  if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
  res.json({ success: true, data: room });
});

/** POST /api/v1/rooms — create a room */
router.post('/', (req: Request, res: Response) => {
  const parsed = CreateRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.message });
  }
  const { name, playerName, maxPlayers, gameDefId } = parsed.data;
  const host: Player = {
    id: generateId(),
    name: playerName,
    isHost: true,
    isConnected: true,
    metadata: {},
  };
  const room = roomManager.createRoom({ name, host, maxPlayers, gameDefId });
  res.status(201).json({ success: true, data: { room, playerId: host.id } });
});

/** POST /api/v1/rooms/join */
router.post('/join', (req: Request, res: Response) => {
  const parsed = JoinRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.message });
  }
  const { code, playerName, playerId } = parsed.data;
  const player: Player = {
    id: playerId ?? generateId(),
    name: playerName,
    isHost: false,
    isConnected: true,
    metadata: {},
  };
  const result = roomManager.joinRoom(code, player);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({ success: true, data: { room: result.room, playerId: player.id } });
});

/** DELETE /api/v1/rooms/:id/leave */
router.delete('/:id/leave', (req: Request, res: Response) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ success: false, error: 'playerId required' });
  const room = roomManager.leaveRoom(req.params.id, playerId);
  res.json({ success: true, data: room });
});

export default router;
