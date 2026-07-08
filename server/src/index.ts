import Fastify from 'fastify';
import cors from '@fastify/cors';
import { randomBytes } from 'node:crypto';
import { DAILY_MAX_MISSES, getDailySeed } from '../../src/config/daily.config.js';
import type { ReplayPayload } from '../../src/types/race.types.js';
import { validateDailySubmit, type SubmitBody } from './replayValidator.js';
import { sanitizeDisplayName, SERVER_DEFAULT_DISPLAY_NAME } from '../../src/utils/displayName.js';
import { loadDb, saveDb, todayKey, resolveDisplayName, syncScoresDisplayName, type DbPlayer, type DbScore } from './store.js';

const PORT = Number(process.env.PORT ?? 3000);
const SUBMIT_COOLDOWN_MS = 5_000;

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const lastSubmitAt = new Map<string, number>();

function authPlayer(authHeader: string | undefined): DbPlayer | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const db = loadDb();
  return db.players.find((p) => p.token === token) ?? null;
}

function computeScore(rank: number, perfectRate: number, totalBoats: number): number {
  const rankBonus = (totalBoats - rank + 1) * 100;
  return Math.round(perfectRate * 500 + rankBonus);
}

// POST /auth/guest
app.post<{ Body: { deviceId: string; displayName?: string } }>('/auth/guest', async (req, reply) => {
  const { deviceId, displayName: rawName } = req.body ?? {};
  const displayName = sanitizeDisplayName(rawName ?? '', SERVER_DEFAULT_DISPLAY_NAME);
  if (!deviceId) {
    return reply.status(400).send({ ok: false, error: { code: 'INVALID_BODY', message: 'deviceId required' } });
  }

  const db = loadDb();
  let player = db.players.find((p) => p.deviceId === deviceId);
  if (!player) {
    player = {
      id: `p_${randomBytes(8).toString('hex')}`,
      deviceId,
      displayName,
      token: randomBytes(24).toString('hex'),
      profile: {},
      updatedAt: Date.now(),
    };
    db.players.push(player);
    saveDb(db);
  }

  return { ok: true, data: { token: player.token, playerId: player.id, displayName: player.displayName } };
});

// GET /player/me
app.get('/player/me', async (req, reply) => {
  const player = authPlayer(req.headers.authorization);
  if (!player) {
    return reply.status(401).send({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
  return { ok: true, data: { profile: player.profile, updatedAt: player.updatedAt } };
});

// PUT /player/me
app.put<{ Body: { profile: Record<string, unknown> } }>('/player/me', async (req, reply) => {
  const player = authPlayer(req.headers.authorization);
  if (!player) {
    return reply.status(401).send({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }

  const db = loadDb();
  const idx = db.players.findIndex((p) => p.id === player.id);
  if (idx === -1) {
    return reply.status(404).send({ ok: false, error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found' } });
  }

  db.players[idx]!.profile = req.body.profile ?? {};
  db.players[idx]!.updatedAt = Date.now();
  if (typeof req.body.profile?.displayName === 'string') {
    const newName = sanitizeDisplayName(req.body.profile.displayName);
    db.players[idx]!.displayName = newName;
    syncScoresDisplayName(db, player.id, newName);
  }
  saveDb(db);

  return { ok: true, data: { updatedAt: db.players[idx]!.updatedAt } };
});

// GET /daily
app.get('/daily', async () => {
  const date = todayKey();
  const seed = getDailySeed(date);
  return {
    ok: true,
    data: {
      date,
      seed,
      condition: `Miss tối đa ${DAILY_MAX_MISSES} lần`,
      maxMisses: DAILY_MAX_MISSES,
    },
  };
});

// POST /scores — chỉ daily, validate replay server-side
app.post<{ Body: SubmitBody }>('/scores', async (req, reply) => {
  const player = authPlayer(req.headers.authorization);
  if (!player) {
    return reply.status(401).send({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }

  const body = req.body;
  if (!body?.replay?.inputs || !body.raceConfig) {
    return reply.status(400).send({
      ok: false,
      error: { code: 'INVALID_BODY', message: 'Full replay and raceConfig required' },
    });
  }

  const now = Date.now();
  const lastAt = lastSubmitAt.get(player.id) ?? 0;
  if (now - lastAt < SUBMIT_COOLDOWN_MS) {
    return reply.status(429).send({
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Submit too fast' },
    });
  }

  const validation = validateDailySubmit(body);
  if (!validation.valid) {
    return reply.status(400).send({
      ok: false,
      error: { code: validation.code, message: validation.message },
    });
  }

  const db = loadDb();
  const date = todayKey();
  const existing = db.scores.find((s) => s.playerId === player.id && s.date === date && s.mode === 'daily');
  if (existing) {
    return reply.status(409).send({
      ok: false,
      error: { code: 'DUPLICATE_SUBMIT', message: 'Already submitted today' },
    });
  }

  const score = computeScore(validation.rank, validation.perfectRate, body.totalBoats);
  const entry: DbScore = {
    id: `s_${randomBytes(6).toString('hex')}`,
    playerId: player.id,
    displayName: sanitizeDisplayName(body.displayName ?? player.displayName),
    mode: 'daily',
    seed: body.seed,
    rank: validation.rank,
    perfectRate: validation.perfectRate,
    score,
    date,
    createdAt: Date.now(),
  };

  db.scores.push(entry);
  saveDb(db);
  lastSubmitAt.set(player.id, now);

  const dailyRank =
    db.scores
      .filter((s) => s.date === date && s.mode === 'daily')
      .sort((a, b) => b.score - a.score)
      .findIndex((s) => s.id === entry.id) + 1;

  return {
    ok: true,
    data: { score, rank: dailyRank, validated: true },
  };
});

// GET /leaderboard/daily
app.get('/leaderboard/daily', async () => {
  const db = loadDb();
  const date = todayKey();
  const entries = db.scores
    .filter((s) => s.date === date && s.mode === 'daily')
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .map((s, i) => ({
      rank: i + 1,
      displayName: resolveDisplayName(db, s),
      score: s.score,
      perfectRate: s.perfectRate,
      mode: s.mode,
    }));

  return { ok: true, data: { date, entries } };
});

// GET /leaderboard/weekly — best daily score per player (7 ngày)
app.get('/leaderboard/weekly', async () => {
  const db = loadDb();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const byPlayer = new Map<string, DbScore>();

  for (const s of db.scores) {
    if (s.createdAt < weekAgo || s.mode !== 'daily') continue;
    const prev = byPlayer.get(s.playerId);
    if (!prev || s.score > prev.score) byPlayer.set(s.playerId, s);
  }

  const entries = [...byPlayer.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .map((s, i) => ({
      rank: i + 1,
      displayName: resolveDisplayName(db, s),
      score: s.score,
      perfectRate: s.perfectRate,
    }));

  return { ok: true, data: { entries } };
});

app.get('/health', async () => ({ ok: true }));

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`API server http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

