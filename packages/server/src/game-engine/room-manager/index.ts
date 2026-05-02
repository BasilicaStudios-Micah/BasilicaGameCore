// ============================================================
// BasilicaGameCore — Room Manager
// BasilicaStudiosLLC
// ============================================================

import {
  Room,
  Player,
  RoomStatus,
  generateId,
  generateRoomCode,
  DEFAULT_MAX_PLAYERS,
  MAX_ROOM_CODE_ATTEMPTS,
} from '@basilica/shared';
import { store } from '../../utils/store';

export interface CreateRoomOptions {
  name: string;
  host: Player;
  maxPlayers?: number;
  gameDefId?: string;
}

export interface JoinRoomResult {
  success: boolean;
  room?: Room;
  error?: string;
}

export class RoomManager {
  createRoom(opts: CreateRoomOptions): Room {
    const code = this.generateUniqueCode();
    const room: Room = {
      id: generateId(),
      code,
      name: opts.name,
      hostId: opts.host.id,
      players: [{ ...opts.host, isHost: true }],
      maxPlayers: opts.maxPlayers ?? DEFAULT_MAX_PLAYERS,
      status: 'waiting',
      gameDefId: opts.gameDefId,
      createdAt: new Date(),
      metadata: {},
    };
    return store.upsertRoom(room);
  }

  joinRoom(code: string, player: Player): JoinRoomResult {
    const room = store.getRoomByCode(code);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.status !== 'waiting') return { success: false, error: 'Room is not accepting players' };
    if (room.players.length >= room.maxPlayers) return { success: false, error: 'Room is full' };
    if (room.players.find(p => p.id === player.id)) {
      return { success: true, room }; // already in room
    }

    const updatedRoom: Room = {
      ...room,
      players: [...room.players, { ...player, isHost: false }],
    };
    return { success: true, room: store.upsertRoom(updatedRoom) };
  }

  leaveRoom(roomId: string, playerId: string): Room | null {
    const room = store.getRoomById(roomId);
    if (!room) return null;

    const updatedPlayers = room.players.filter(p => p.id !== playerId);

    // If no players left, delete the room
    if (updatedPlayers.length === 0) {
      store.deleteRoom(roomId);
      return null;
    }

    // If host left, assign new host
    let newHostId = room.hostId;
    if (room.hostId === playerId) {
      newHostId = updatedPlayers[0].id;
      updatedPlayers[0] = { ...updatedPlayers[0], isHost: true };
    }

    const updatedRoom: Room = {
      ...room,
      hostId: newHostId,
      players: updatedPlayers,
    };
    return store.upsertRoom(updatedRoom);
  }

  setStatus(roomId: string, status: RoomStatus): Room | null {
    const room = store.getRoomById(roomId);
    if (!room) return null;
    return store.upsertRoom({ ...room, status });
  }

  setPlayerConnection(roomId: string, playerId: string, connected: boolean): Room | null {
    const room = store.getRoomById(roomId);
    if (!room) return null;
    const players = room.players.map(p =>
      p.id === playerId ? { ...p, isConnected: connected } : p
    );
    return store.upsertRoom({ ...room, players });
  }

  private generateUniqueCode(): string {
    for (let i = 0; i < MAX_ROOM_CODE_ATTEMPTS; i++) {
      const code = generateRoomCode();
      if (!store.getRoomByCode(code)) return code;
    }
    throw new Error('Unable to generate unique room code');
  }
}

export const roomManager = new RoomManager();
