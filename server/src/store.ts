import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dir, '..', 'data');
const DB_FILE = join(DATA_DIR, 'db.json');

export interface DbPlayer {
  id: string;
  deviceId: string;
  displayName: string;
  token: string;
  profile: Record<string, unknown>;
  updatedAt: number;
}

export interface DbScore {
  id: string;
  playerId: string;
  displayName: string;
  mode: string;
  seed: number;
  rank: number;
  perfectRate: number;
  score: number;
  date: string;
  createdAt: number;
}

export interface DbState {
  players: DbPlayer[];
  scores: DbScore[];
}

function defaultDb(): DbState {
  return { players: [], scores: [] };
}

export function loadDb(): DbState {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) {
    const db = defaultDb();
    saveDb(db);
    return db;
  }
  return JSON.parse(readFileSync(DB_FILE, 'utf-8')) as DbState;
}

export function saveDb(db: DbState): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
