// XP Store — Praça (localStorage)
// Guarda XP + stats por praça (squareId), por usuário.
// Storage key: publicSquares.xp.<squareId>
import { getRule } from "./xpRules.js";

function key(squareId) {
  return `publicSquares.xp.${squareId}`;
}

function safeParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function read(squareId) {
  if (!squareId) return {};
  const raw = localStorage.getItem(key(squareId));
  return safeParse(raw, {});
}

function write(squareId, data) {
  if (!squareId) return;
  localStorage.setItem(key(squareId), JSON.stringify(data || {}));
}

function todayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function levelFromXp(xp) {
  // MVP: 100 XP por level
  const n = Math.max(0, Number(xp) || 0);
  return Math.floor(n / 100) + 1;
}

export function getUser(squareId, user) {
  const uid = user?.id;
  if (!squareId || !uid) return null;

  const db = read(squareId);
  const entry = db[uid] || null;
  if (!entry) return { userId: uid, name: user?.name || "—", avatar: user?.avatar || "", xp: 0, level: 1, stats: {} };

  const xp = Number(entry.xp) || 0;
  return {
    ...entry,
    xp,
    level: levelFromXp(xp),
  };
}

export function awardXp(squareId, user, actionKey, meta = {}) {
  const uid = user?.id;
  if (!squareId || !uid) {
    return { ok: false, reason: "NO_USER", me: null, leaderboard: [] };
  }

  const now = Date.now();
  const rule = getRule(actionKey);
  const db = read(squareId);

  const prev = db[uid] || {
    userId: uid,
    name: user?.name || "—",
    avatar: user?.avatar || "",
    xp: 0,
    level: 1,
    stats: {},
    lastActions: {},
    updatedAt: now,
  };

  // atualiza snapshot de perfil (pra leaderboard ficar bonito)
  prev.name = user?.name || prev.name || "—";
  prev.avatar = user?.avatar || prev.avatar || "";

  const stats = prev.stats || {};
  const lastActions = prev.lastActions || {};

  // daily cap (ex: CHAT_MSG)
  if (rule?.dailyCap) {
    const day = todayKey(now);
    const bucketKey = `${actionKey}:${day}`;
    const used = Number(lastActions[bucketKey]) || 0;

    if (used >= rule.dailyCap) {
      // já atingiu cap hoje, não ganha XP
      db[uid] = { ...prev, stats, lastActions, updatedAt: now, level: levelFromXp(prev.xp) };
      write(squareId, db);
      return { ok: false, reason: "DAILY_CAP", me: getUser(squareId, user), leaderboard: getLeaderboard(squareId) };
    }

    lastActions[bucketKey] = used + 1;
  }

  // aplica XP
  const add = Number(rule?.xp) || 0;
  const nextXp = (Number(prev.xp) || 0) + add;

  // conta stats
  stats[actionKey] = (Number(stats[actionKey]) || 0) + 1;

  const next = {
    ...prev,
    xp: nextXp,
    stats,
    lastActions,
    updatedAt: now,
    level: levelFromXp(nextXp),
    lastMeta: { actionKey, ...meta, at: now },
  };

  db[uid] = next;
  write(squareId, db);

  return { ok: true, reason: "OK", addedXp: add, me: next, leaderboard: getLeaderboard(squareId) };
}

export function getLeaderboard(squareId, { limit = 50 } = {}) {
  const db = read(squareId);
  const list = Object.values(db || {})
    .map((e) => {
      const xp = Number(e?.xp) || 0;
      return {
        userId: e.userId,
        name: e.name || "—",
        avatar: e.avatar || "",
        xp,
        level: levelFromXp(xp),
        updatedAt: e.updatedAt || 0,
      };
    })
    .sort((a, b) => b.xp - a.xp || b.updatedAt - a.updatedAt);

  return list.slice(0, Math.max(1, limit));
}

export function getRankOfUser(squareId, userId) {
  if (!squareId || !userId) return null;
  const db = read(squareId);
  const list = Object.values(db || [])
    .map((e) => ({ userId: e.userId, xp: Number(e?.xp) || 0, updatedAt: e.updatedAt || 0 }))
    .sort((a, b) => b.xp - a.xp || b.updatedAt - a.updatedAt);

  const idx = list.findIndex((x) => x.userId === userId);
  if (idx < 0) return null;
  return idx + 1;
}

export function getStats(squareId, userId) {
  if (!squareId || !userId) return {};
  const db = read(squareId);
  return db?.[userId]?.stats || {};
}
