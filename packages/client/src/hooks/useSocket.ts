import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@basilica/shared';
import { useLobbyStore } from '../store';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function useRoomSocket(roomId: string | null, playerId: string | null) {
  const { updateRoom } = useLobbyStore();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !playerId) return;
    const sock = getSocket();

    if (!joinedRef.current) {
      sock.emit('room:join', { roomId, playerId });
      joinedRef.current = true;
    }

    sock.on(WS_EVENTS.ROOM_UPDATED, updateRoom);

    return () => {
      sock.off(WS_EVENTS.ROOM_UPDATED, updateRoom);
      if (joinedRef.current) {
        sock.emit('room:leave', { roomId, playerId });
        joinedRef.current = false;
      }
    };
  }, [roomId, playerId]);
}
