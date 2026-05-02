// ============================================================
// BasilicaGameCore — Shared Constants
// BasilicaStudiosLLC
// ============================================================

export const ENGINE_VERSION = '0.1.0';
export const ENGINE_NAME = 'BasilicaGameCore';
export const ENGINE_AUTHOR = 'BasilicaStudiosLLC';

// Lobby
export const MAX_ROOM_CODE_ATTEMPTS = 10;
export const DEFAULT_MAX_PLAYERS = 8;
export const MIN_PLAYERS = 1;
export const ROOM_CODE_LENGTH = 6;

// Board
export const DEFAULT_BOARD_ROWS = 8;
export const DEFAULT_BOARD_COLS = 8;
export const DEFAULT_TILE_SIZE = 64; // px
export const MAX_BOARD_LAYERS = 10;
export const MAX_BOARD_ROWS = 64;
export const MAX_BOARD_COLS = 64;

// Cards
export const DEFAULT_HAND_SIZE = 7;
export const MAX_DECK_SIZE = 60;
export const MIN_DECK_SIZE = 1;
export const MAX_COPIES_PER_CARD = 4;

// Dice
export const STANDARD_DIE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;
export const MAX_DICE_PER_ROLL = 20;

// Script
export const BASILICA_SCRIPT_VERSION = '0.1.0';
export const MAX_SCRIPT_LENGTH = 10_000; // characters
export const SCRIPT_EXECUTION_TIMEOUT_MS = 1_000;

// API
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// WebSocket events
export const WS_EVENTS = {
  // Room
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  ROOM_UPDATED: 'room:updated',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  // Game
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  GAME_STATE_UPDATED: 'game:state_updated',
  // Turn
  TURN_STARTED: 'turn:started',
  TURN_ENDED: 'turn:ended',
  PHASE_CHANGED: 'phase:changed',
  // Actions
  ACTION_SUBMITTED: 'action:submitted',
  ACTION_REJECTED: 'action:rejected',
  // Dice
  DICE_ROLLED: 'dice:rolled',
  // Chat
  CHAT_MESSAGE: 'chat:message',
} as const;
