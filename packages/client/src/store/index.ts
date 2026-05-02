// ============================================================
// BasilicaGameCore — Client State (Zustand)
// BasilicaStudiosLLC
// ============================================================

import { create } from 'zustand';
import type {
  Room,
  GameState,
  BoardDefinition,
  CardDefinition,
  DeckDefinition,
  DieDefinition,
  Player,
} from '@basilica/shared';

// ─── Auth / Session ─────────────────────────────────────────

interface SessionState {
  playerId: string | null;
  playerName: string | null;
  setSession: (playerId: string, playerName: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  playerId: localStorage.getItem('bgc_player_id'),
  playerName: localStorage.getItem('bgc_player_name'),
  setSession: (playerId, playerName) => {
    localStorage.setItem('bgc_player_id', playerId);
    localStorage.setItem('bgc_player_name', playerName);
    set({ playerId, playerName });
  },
  clearSession: () => {
    localStorage.removeItem('bgc_player_id');
    localStorage.removeItem('bgc_player_name');
    set({ playerId: null, playerName: null });
  },
}));

// ─── Room / Lobby ───────────────────────────────────────────

interface LobbyState {
  currentRoom: Room | null;
  rooms: Room[];
  setCurrentRoom: (room: Room | null) => void;
  setRooms: (rooms: Room[]) => void;
  updateRoom: (room: Room) => void;
}

export const useLobbyStore = create<LobbyState>((set) => ({
  currentRoom: null,
  rooms: [],
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setRooms: (rooms) => set({ rooms }),
  updateRoom: (room) =>
    set((state) => ({
      currentRoom: state.currentRoom?.id === room.id ? room : state.currentRoom,
      rooms: state.rooms.map((r) => (r.id === room.id ? room : r)),
    })),
}));

// ─── Board ──────────────────────────────────────────────────

interface BoardState {
  boards: BoardDefinition[];
  activeBoard: BoardDefinition | null;
  setBoards: (boards: BoardDefinition[]) => void;
  setActiveBoard: (board: BoardDefinition | null) => void;
  updateBoard: (board: BoardDefinition) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  activeBoard: null,
  setBoards: (boards) => set({ boards }),
  setActiveBoard: (board) => set({ activeBoard: board }),
  updateBoard: (board) =>
    set((state) => ({
      boards: state.boards.map((b) => (b.id === board.id ? board : b)),
      activeBoard: state.activeBoard?.id === board.id ? board : state.activeBoard,
    })),
}));

// ─── Cards ──────────────────────────────────────────────────

interface CardState {
  cards: CardDefinition[];
  decks: DeckDefinition[];
  setCards: (cards: CardDefinition[]) => void;
  setDecks: (decks: DeckDefinition[]) => void;
  addCard: (card: CardDefinition) => void;
  updateCard: (card: CardDefinition) => void;
}

export const useCardStore = create<CardState>((set) => ({
  cards: [],
  decks: [],
  setCards: (cards) => set({ cards }),
  setDecks: (decks) => set({ decks }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  updateCard: (card) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === card.id ? card : c)),
    })),
}));

// ─── Dice ───────────────────────────────────────────────────

interface DiceState {
  dieDefinitions: DieDefinition[];
  rollHistory: Array<{ id: string; label: string; results: number[]; total: number; ts: Date }>;
  setDieDefinitions: (defs: DieDefinition[]) => void;
  addRollResult: (result: DiceState['rollHistory'][number]) => void;
  clearHistory: () => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  dieDefinitions: [],
  rollHistory: [],
  setDieDefinitions: (defs) => set({ dieDefinitions: defs }),
  addRollResult: (result) =>
    set((state) => ({ rollHistory: [result, ...state.rollHistory].slice(0, 50) })),
  clearHistory: () => set({ rollHistory: [] }),
}));

// ─── Game State ─────────────────────────────────────────────

interface GameStore {
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  updateGameState: (partial: Partial<GameState>) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  setGameState: (gameState) => set({ gameState }),
  updateGameState: (partial) =>
    set((state) =>
      state.gameState ? { gameState: { ...state.gameState, ...partial } } : {}
    ),
}));

// ─── UI ─────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  activeTab: string;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeTab: 'lobby',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
