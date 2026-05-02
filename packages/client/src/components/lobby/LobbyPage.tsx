// ============================================================
// BasilicaGameCore — Lobby Page
// BasilicaStudiosLLC
// ============================================================

import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Badge, EmptyState } from '../shared/primitives';
import { roomsApi } from '../../utils/api';
import { useLobbyStore, useSessionStore } from '../../store';
import { useRoomSocket } from '../../hooks/useSocket';
import type { Room } from '@basilica/shared';

type View = 'list' | 'create' | 'room';

export const LobbyPage: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');

  const { rooms, setRooms, currentRoom, setCurrentRoom } = useLobbyStore();
  const { playerId, playerName: savedName, setSession } = useSessionStore();

  useRoomSocket(currentRoom?.id ?? null, playerId);

  useEffect(() => {
    if (savedName) setPlayerName(savedName);
    if (savedName) setJoinName(savedName);
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const data = await roomsApi.list();
      setRooms(data);
    } catch { /* silent */ }
  }

  async function handleCreate() {
    if (!roomName.trim() || !playerName.trim()) return;
    setLoading(true); setError('');
    try {
      const { room, playerId: pid } = await roomsApi.create(roomName, playerName, { maxPlayers });
      setSession(pid, playerName);
      setCurrentRoom(room);
      setView('room');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleJoin(code?: string) {
    const c = code ?? joinCode;
    if (!c.trim() || !joinName.trim()) return;
    setLoading(true); setError('');
    try {
      const { room, playerId: pid } = await roomsApi.join(c, joinName, playerId ?? undefined);
      setSession(pid, joinName);
      setCurrentRoom(room);
      setView('room');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleLeave() {
    if (!currentRoom || !playerId) return;
    await roomsApi.leave(currentRoom.id, playerId);
    setCurrentRoom(null);
    setView('list');
    loadRooms();
  }

  if (view === 'room' && currentRoom) {
    return <RoomView room={currentRoom} playerId={playerId!} onLeave={handleLeave} />;
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>Lobby</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Create a new game room or join an existing one with a code.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-bg)', border: '1px solid var(--error)',
            borderRadius: 'var(--radius)', padding: '10px 14px',
            color: 'var(--error)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)',
          }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {/* Create Room */}
          <Card style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-md)' }}>Create Room</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input label="Room Name" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="My Game Room" />
              <Input label="Your Name" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Player 1" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Max Players: {maxPlayers}
                </label>
                <input
                  type="range" min={2} max={16} value={maxPlayers}
                  onChange={e => setMaxPlayers(Number(e.target.value))}
                  style={{ accentColor: 'var(--accent)', width: '100%' }}
                />
              </div>
              <Button variant="primary" onClick={handleCreate} loading={loading} style={{ marginTop: 4 }}>
                Create Room
              </Button>
            </div>
          </Card>

          {/* Join Room */}
          <Card style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-md)' }}>Join Room</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Room Code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', fontSize: 'var(--text-md)' }}
              />
              <Input label="Your Name" value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Player 2" />
              <div style={{ flex: 1 }} />
              <Button
                variant="primary" onClick={() => handleJoin()} loading={loading}
                disabled={joinCode.length !== 6}
                style={{ marginTop: 'var(--space-6)' }}
              >
                Join Room
              </Button>
            </div>
          </Card>
        </div>

        {/* Room List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)' }}>Open Rooms</h2>
            <Button size="sm" variant="ghost" onClick={loadRooms}>↻ Refresh</Button>
          </div>

          {rooms.length === 0 ? (
            <EmptyState icon="⊞" title="No open rooms" description="Create one above to get started." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {rooms.map(room => (
                <Card key={room.id} hoverable style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{room.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {room.players.length}/{room.maxPlayers} players · Code: <code style={{ fontFamily: 'var(--font-mono)' }}>{room.code}</code>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Badge color={room.status === 'waiting' ? 'success' : 'warning'}>{room.status}</Badge>
                    {room.status === 'waiting' && (
                      <Button size="sm" onClick={() => handleJoin(room.code)}>Join</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Room View ──────────────────────────────────────────────

const RoomView: React.FC<{ room: Room; playerId: string; onLeave: () => void }> = ({ room, playerId, onLeave }) => {
  const { currentRoom } = useLobbyStore();
  const displayRoom = currentRoom?.id === room.id ? currentRoom : room;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>{displayRoom.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge color="success">{displayRoom.status}</Badge>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Join code:
              </span>
              <code style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600,
                letterSpacing: '0.1em', background: 'var(--bg-secondary)',
                padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              }}>{displayRoom.code}</code>
            </div>
          </div>
          <Button variant="danger" onClick={onLeave} size="sm">Leave Room</Button>
        </div>

        <Card style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-md)' }}>
            Players ({displayRoom.players.length}/{displayRoom.maxPlayers})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {displayRoom.players.map(player => (
              <div key={player.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: '8px 12px', borderRadius: 'var(--radius)',
                background: player.id === playerId ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                border: player.id === playerId ? '1px solid var(--accent-subtle-border)' : '1px solid var(--border)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: player.isHost ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                  color: player.isHost ? 'var(--bg)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{player.name}</span>
                  {player.id === playerId && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginLeft: 6 }}>you</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {player.isHost && <Badge color="accent">Host</Badge>}
                  <Badge color={player.isConnected ? 'success' : 'default'}>
                    {player.isConnected ? 'online' : 'offline'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {displayRoom.players.length < displayRoom.maxPlayers && (
            <div style={{
              marginTop: 'var(--space-3)',
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
              textAlign: 'center',
            }}>
              Waiting for {displayRoom.maxPlayers - displayRoom.players.length} more player(s)…
            </div>
          )}
        </Card>

        {displayRoom.players.find(p => p.id === playerId)?.isHost && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="primary" style={{ flex: 1 }} disabled={displayRoom.players.length < 1}>
              Start Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
