// ============================================================
// BasilicaGameCore — API Client
// BasilicaStudiosLLC
// ============================================================

import { API_PREFIX } from '@basilica/shared';

const BASE = API_PREFIX; // '/api/v1'

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'API error');
  return json.data as T;
}

// ─── Rooms ──────────────────────────────────────────────────

export const roomsApi = {
  list: () => request<any[]>('GET', '/rooms'),
  get: (id: string) => request<any>('GET', `/rooms/${id}`),
  create: (name: string, playerName: string, opts?: { maxPlayers?: number }) =>
    request<any>('POST', '/rooms', { name, playerName, ...opts }),
  join: (code: string, playerName: string, playerId?: string) =>
    request<any>('POST', '/rooms/join', { code, playerName, playerId }),
  leave: (id: string, playerId: string) =>
    request<any>('DELETE', `/rooms/${id}/leave`, { playerId }),
};

// ─── Boards ─────────────────────────────────────────────────

export const boardsApi = {
  list: () => request<any[]>('GET', '/boards'),
  get: (id: string) => request<any>('GET', `/boards/${id}`),
  create: (opts: { name?: string; rows?: number; cols?: number; tileShape?: string }) =>
    request<any>('POST', '/boards', opts),
  update: (id: string, data: Partial<any>) =>
    request<any>('PUT', `/boards/${id}`, data),
  delete: (id: string) => request<any>('DELETE', `/boards/${id}`),
  addTile: (boardId: string, tile: Partial<any>) =>
    request<any>('POST', `/boards/${boardId}/tiles`, tile),
};

// ─── Cards ──────────────────────────────────────────────────

export const cardsApi = {
  listCards: () => request<any[]>('GET', '/cards/cards'),
  createCard: (data: Partial<any>) => request<any>('POST', '/cards/cards', data),
  updateCard: (id: string, data: Partial<any>) => request<any>('PUT', `/cards/cards/${id}`, data),
  listDecks: () => request<any[]>('GET', '/cards/decks'),
  createDeck: (data: Partial<any>) => request<any>('POST', '/cards/decks', data),
  updateDeck: (id: string, data: Partial<any>) => request<any>('PUT', `/cards/decks/${id}`, data),
};

// ─── Dice ───────────────────────────────────────────────────

export const diceApi = {
  listDefinitions: () => request<any[]>('GET', '/dice/definitions'),
  standardTypes: () => request<any[]>('GET', '/dice/standard'),
  roll: (dice: Array<{ faces?: number; dieDefId?: string; count: number }>, seed?: number) =>
    request<any>('POST', '/dice/roll', { dice, seed }),
};

// ─── Script ─────────────────────────────────────────────────

export const scriptApi = {
  validate: (source: string) =>
    request<{ valid: boolean; errors: string[] }>('POST', '/script/validate', { source }),
  execute: (source: string, eventType: string, opts?: { scriptContext?: Record<string, unknown> }) =>
    request<any>('POST', '/script/execute', { source, eventType, ...opts }),
};
