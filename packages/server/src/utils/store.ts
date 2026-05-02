// ============================================================
// BasilicaGameCore — Local In-Memory Store
// Replaces PostgreSQL/Prisma during early development.
// BasilicaStudiosLLC
// ============================================================

import {
  Room,
  GameState,
  GameDefinition,
  BoardDefinition,
  DeckDefinition,
  CardDefinition,
  DieDefinition,
  TurnStructure,
  Player,
} from '@basilica/shared';

class InMemoryStore {
  private rooms = new Map<string, Room>();
  private gameStates = new Map<string, GameState>();
  private gameDefinitions = new Map<string, GameDefinition>();
  private boardDefinitions = new Map<string, BoardDefinition>();
  private deckDefinitions = new Map<string, DeckDefinition>();
  private cardDefinitions = new Map<string, CardDefinition>();
  private dieDefinitions = new Map<string, DieDefinition>();
  private turnStructures = new Map<string, TurnStructure>();

  // ─── Rooms ──────────────────────────────────────────────

  upsertRoom(room: Room): Room {
    this.rooms.set(room.id, room);
    return room;
  }

  getRoomById(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  getRoomByCode(code: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.code === code.toUpperCase()) return room;
    }
    return undefined;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  deleteRoom(id: string): boolean {
    return this.rooms.delete(id);
  }

  // ─── Game States ────────────────────────────────────────

  upsertGameState(state: GameState): GameState {
    this.gameStates.set(state.id, state);
    return state;
  }

  getGameStateById(id: string): GameState | undefined {
    return this.gameStates.get(id);
  }

  getGameStateByRoomId(roomId: string): GameState | undefined {
    for (const state of this.gameStates.values()) {
      if (state.roomId === roomId) return state;
    }
    return undefined;
  }

  // ─── Game Definitions ───────────────────────────────────

  upsertGameDefinition(def: GameDefinition): GameDefinition {
    this.gameDefinitions.set(def.id, def);
    return def;
  }

  getGameDefinitionById(id: string): GameDefinition | undefined {
    return this.gameDefinitions.get(id);
  }

  getAllGameDefinitions(): GameDefinition[] {
    return Array.from(this.gameDefinitions.values());
  }

  deleteGameDefinition(id: string): boolean {
    return this.gameDefinitions.delete(id);
  }

  // ─── Board Definitions ──────────────────────────────────

  upsertBoardDefinition(def: BoardDefinition): BoardDefinition {
    this.boardDefinitions.set(def.id, def);
    return def;
  }

  getBoardDefinitionById(id: string): BoardDefinition | undefined {
    return this.boardDefinitions.get(id);
  }

  getAllBoardDefinitions(): BoardDefinition[] {
    return Array.from(this.boardDefinitions.values());
  }

  deleteBoardDefinition(id: string): boolean {
    return this.boardDefinitions.delete(id);
  }

  // ─── Deck Definitions ───────────────────────────────────

  upsertDeckDefinition(def: DeckDefinition): DeckDefinition {
    this.deckDefinitions.set(def.id, def);
    return def;
  }

  getDeckDefinitionById(id: string): DeckDefinition | undefined {
    return this.deckDefinitions.get(id);
  }

  getAllDeckDefinitions(): DeckDefinition[] {
    return Array.from(this.deckDefinitions.values());
  }

  // ─── Card Definitions ───────────────────────────────────

  upsertCardDefinition(def: CardDefinition): CardDefinition {
    this.cardDefinitions.set(def.id, def);
    return def;
  }

  getCardDefinitionById(id: string): CardDefinition | undefined {
    return this.cardDefinitions.get(id);
  }

  getAllCardDefinitions(): CardDefinition[] {
    return Array.from(this.cardDefinitions.values());
  }

  // ─── Die Definitions ────────────────────────────────────

  upsertDieDefinition(def: DieDefinition): DieDefinition {
    this.dieDefinitions.set(def.id, def);
    return def;
  }

  getDieDefinitionById(id: string): DieDefinition | undefined {
    return this.dieDefinitions.get(id);
  }

  getAllDieDefinitions(): DieDefinition[] {
    return Array.from(this.dieDefinitions.values());
  }

  // ─── Turn Structures ────────────────────────────────────

  upsertTurnStructure(ts: TurnStructure): TurnStructure {
    this.turnStructures.set(ts.id, ts);
    return ts;
  }

  getTurnStructureById(id: string): TurnStructure | undefined {
    return this.turnStructures.get(id);
  }

  getAllTurnStructures(): TurnStructure[] {
    return Array.from(this.turnStructures.values());
  }

  // ─── Stats ──────────────────────────────────────────────

  stats() {
    return {
      rooms: this.rooms.size,
      gameStates: this.gameStates.size,
      gameDefinitions: this.gameDefinitions.size,
      boardDefinitions: this.boardDefinitions.size,
      deckDefinitions: this.deckDefinitions.size,
      cardDefinitions: this.cardDefinitions.size,
      dieDefinitions: this.dieDefinitions.size,
      turnStructures: this.turnStructures.size,
    };
  }
}

// Singleton
export const store = new InMemoryStore();
