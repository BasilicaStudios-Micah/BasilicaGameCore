// ============================================================
// BasilicaGameCore — Canonical Game Types
// BasilicaStudiosLLC
// ============================================================

// ─── Utility ────────────────────────────────────────────────

export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// ─── Player ─────────────────────────────────────────────────

export interface Player {
  id: ID;
  name: string;
  avatarUrl?: string;
  isHost: boolean;
  isConnected: boolean;
  metadata: Record<string, unknown>;
}

// ─── Board ──────────────────────────────────────────────────

export type TileShape = 'square' | 'hex' | 'triangle' | 'custom';

export interface TileDefinition {
  id: ID;
  shape: TileShape;
  label?: string;
  color?: string;
  imageUrl?: string;
  passable: boolean;
  metadata: Record<string, unknown>;
}

export interface BoardCell {
  row: number;
  col: number;
  tileDefId: ID;
  occupantId?: ID;   // entity occupying this cell
  metadata: Record<string, unknown>;
}

export interface BoardLayer {
  id: ID;
  name: string;
  visible: boolean;
  locked: boolean;
  cells: BoardCell[];
}

export interface BoardDefinition {
  id: ID;
  name: string;
  rows: number;
  cols: number;
  tileSize: number;
  tileShape: TileShape;
  layers: BoardLayer[];
  tileDefinitions: TileDefinition[];
  metadata: Record<string, unknown>;
}

// ─── Cards ──────────────────────────────────────────────────

export type CardType = 'action' | 'item' | 'unit' | 'spell' | 'event' | 'custom';

export interface CardDefinition {
  id: ID;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  imageUrl?: string;
  tags: string[];
  /** BasilicaScript source attached to this card */
  script?: string;
  metadata: Record<string, unknown>;
}

export interface CardInstance {
  instanceId: ID;
  definitionId: ID;
  ownerId: ID;
  faceUp: boolean;
  metadata: Record<string, unknown>;
}

export interface DeckDefinition {
  id: ID;
  name: string;
  cardEntries: Array<{ cardDefId: ID; count: number }>;
  metadata: Record<string, unknown>;
}

export interface DeckInstance {
  id: ID;
  definitionId: ID;
  ownerId: ID;
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  hand: CardInstance[];
}

// ─── Dice ───────────────────────────────────────────────────

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'custom';

export interface DieDefinition {
  id: ID;
  type: DieType;
  faces: number;
  label?: string;
  customFaces?: Array<string | number>;
}

export interface DiceRollRequest {
  dice: Array<{ dieDefId: ID; count: number }>;
  seed?: number;
}

export interface DiceRollResult {
  requestId: ID;
  rolledAt: Date;
  results: Array<{
    dieDefId: ID;
    rolls: number[];
    total: number;
  }>;
  grandTotal: number;
}

// ─── Turn System ────────────────────────────────────────────

export interface TurnPhase {
  id: ID;
  name: string;
  description?: string;
  /** BasilicaScript hooks */
  onEnterScript?: string;
  onExitScript?: string;
  allowedActions: string[];
}

export interface TurnStructure {
  id: ID;
  name: string;
  phases: TurnPhase[];
}

export type TurnOrderMode = 'sequential' | 'initiative' | 'simultaneous' | 'custom';

export interface TurnState {
  turnNumber: number;
  activePlayerId: ID;
  currentPhaseId: ID;
  orderMode: TurnOrderMode;
  playerOrder: ID[];
  metadata: Record<string, unknown>;
}

// ─── Room / Lobby ───────────────────────────────────────────

export type RoomStatus = 'waiting' | 'starting' | 'in_progress' | 'paused' | 'ended';

export interface Room {
  id: ID;
  code: string;       // 6-char join code
  name: string;
  hostId: ID;
  players: Player[];
  maxPlayers: number;
  status: RoomStatus;
  gameDefId?: ID;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

// ─── Game Definition ────────────────────────────────────────

export interface GameDefinition {
  id: ID;
  name: string;
  description?: string;
  author: string;
  version: string;
  boardDefId?: ID;
  deckDefIds: ID[];
  dieDefIds: ID[];
  turnStructureId?: ID;
  /** Global setup script in BasilicaScript */
  setupScript?: string;
  /** Global win-condition script in BasilicaScript */
  winConditionScript?: string;
  metadata: Record<string, unknown>;
}

// ─── Game State ─────────────────────────────────────────────

export interface GameState {
  id: ID;
  roomId: ID;
  gameDefId: ID;
  players: Player[];
  board?: BoardDefinition;
  decks: DeckInstance[];
  turnState: TurnState;
  scriptContext: Record<string, unknown>;
  log: GameLogEntry[];
  startedAt: Date;
  updatedAt: Date;
}

export interface GameLogEntry {
  id: ID;
  timestamp: Date;
  playerId?: ID;
  action: string;
  payload: Record<string, unknown>;
}

// ─── BasilicaScript ─────────────────────────────────────────

export type ScriptEventType =
  | 'on_play'
  | 'on_turn_start'
  | 'on_turn_end'
  | 'on_phase_enter'
  | 'on_phase_exit'
  | 'on_draw'
  | 'on_discard'
  | 'on_move'
  | 'on_attack'
  | 'on_game_start'
  | 'on_game_end';

export interface ScriptExecutionContext {
  playerId?: ID;
  gameState: GameState;
  eventType: ScriptEventType;
  eventPayload?: Record<string, unknown>;
}

export interface ScriptExecutionResult {
  success: boolean;
  mutations: StateMutation[];
  errors: string[];
  log: string[];
}

export interface StateMutation {
  type: 'set' | 'append' | 'remove' | 'increment';
  path: string;
  value: unknown;
}

// ─── API Shapes ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
