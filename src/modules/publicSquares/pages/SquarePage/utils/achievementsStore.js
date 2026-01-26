// Achievements Store — Praça (localStorage)
// Guarda conquistas desbloqueadas por praça (squareId), por usuário.
// Storage key: publicSquares.ach.<squareId>
import { ACHIEVEMENTS } from "./achievements.js";

function key(squareId) {
  return `publicSquares.ach.${squareId}`;
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

export function getUnlockedIds(squareId, userId) {
  if (!squareId || !userId) return [];
  const db = read(squareId);
  return db?.[userId]?.ids || [];
}

export function listUnlocked(squareId, userId) {
  const unlocked = new Set(getUnlockedIds(squareId, userId));
  return ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).map((a) => ({ ...a, unlocked: true }));
}

export function listAllWithState(squareId, userId) {
  const unlocked = new Set(getUnlockedIds(squareId, userId));
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: unlocked.has(a.id) }));
}

export function unlock(squareId, user, achievementId) {
  const userId = user?.id;
  if (!squareId || !userId || !achievementId) return [];
  const db = read(squareId);

  const prev = db[userId] || { ids: [], unlockedAt: {} };
  const ids = new Set(prev.ids || []);
  if (ids.has(achievementId)) return Array.from(ids);

  ids.add(achievementId);
  const unlockedAt = { ...(prev.unlockedAt || {}) };
  unlockedAt[achievementId] = Date.now();

  db[userId] = { ids: Array.from(ids), unlockedAt };
  write(squareId, db);

  return db[userId].ids;
}

export function checkAndUnlock(squareId, user) {
  const userId = user?.id;
  if (!squareId || !userId) return { unlocked: [] };

  const db = read(squareId);
  const prev = db[userId] || { ids: [], unlockedAt: {} };
  const has = new Set(prev.ids || []);

  const unlockedNow = [];
  for (const a of ACHIEVEMENTS) {
    if (has.has(a.id)) continue;
    try {
      if (a.check({ squareId, userId, user })) {
        has.add(a.id);
        unlockedNow.push(a);
      }
    } catch {
      // ignore
    }
  }

  if (unlockedNow.length) {
    const unlockedAt = { ...(prev.unlockedAt || {}) };
    for (const a of unlockedNow) unlockedAt[a.id] = Date.now();
    db[userId] = { ids: Array.from(has), unlockedAt };
    write(squareId, db);
  }

  return { unlocked: unlockedNow };
}
