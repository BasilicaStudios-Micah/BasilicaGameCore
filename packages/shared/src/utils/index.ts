// ============================================================
// BasilicaGameCore — Shared Utilities
// BasilicaStudiosLLC
// ============================================================

import { ID } from '../types';

// ─── ID Generation ──────────────────────────────────────────

export function generateId(): ID {
  return `bgc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Seeded RNG ─────────────────────────────────────────────

/** Mulberry32 — fast, seeded PRNG */
export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollDie(faces: number, rng?: () => number): number {
  const rand = rng ?? Math.random;
  return Math.floor(rand() * faces) + 1;
}

export function rollDice(count: number, faces: number, seed?: number): number[] {
  const rng = seed !== undefined ? createSeededRng(seed) : undefined;
  return Array.from({ length: count }, () => rollDie(faces, rng));
}

// ─── Array Utilities ────────────────────────────────────────

export function shuffle<T>(array: T[], rng?: () => number): T[] {
  const arr = [...array];
  const rand = rng ?? Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function pick<T>(array: T[], rng?: () => number): T {
  const rand = rng ?? Math.random;
  return array[Math.floor(rand() * array.length)];
}

// ─── Object Utilities ───────────────────────────────────────

/** Safe deep-get using dot-path notation, e.g. 'player.stats.health' */
export function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/** Safe deep-set using dot-path notation */
export function setPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const result = { ...obj };
  const keys = path.split('.');
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = { ...(current[key] as Record<string, unknown> ?? {}) };
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

// ─── Validation ─────────────────────────────────────────────

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

export function isValidPlayerName(name: string): boolean {
  return name.length >= 2 && name.length <= 32;
}

// ─── Date Utilities ─────────────────────────────────────────

export function nowISO(): string {
  return new Date().toISOString();
}
