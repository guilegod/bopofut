// src/services/publicCourtsMock.js
// Mock/LocalStorage para MVP do App Praça (sem backend ainda)

const LS_COURTS = "praca:courts:v1";
const LS_PRESENCE = "praca:presence:v1";
const LS_CHAT = "praca:chat:v1";

// ✅ perfis e stats sociais
const LS_PROFILES = "praca:profiles:v1"; // { [userId]: profile }
const LS_USERNAMES = "praca:usernames:v1"; // { [usernameLower]: userId }
const LS_SOCIAL = "praca:social:v1"; // { [userId]: { xp, level, totalCheckins, favoritesMap, last[] } }

// ✅ social graph (amigos/requests/follow + snapshots)
const LS_SOCIAL_GRAPH = "praca:socialGraph:v1"; // { profiles, follows, requests, friends }

function now() {
  return Date.now();
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function readLS(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  return safeJsonParse(raw, fallback);
}

function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uniq(arr) {
  return Array.from(new Set((arr || []).map(String)));
}

// ---------------------------------------------
// Seed de praças
// ---------------------------------------------
export function ensureSeedCourts() {
  const existing = readLS(LS_COURTS, null);
  if (Array.isArray(existing) && existing.length) return existing;

  const seed = [
    {
      id: "praca-7",
      name: "Praça 7 (CIC)",
      city: "Curitiba",
      address: "CIC — Curitiba/PR",
      sports: ["Futebol", "Vôlei"],
      lat: -25.505,
      lng: -49.35,
      photoUrl: "",
    },
    {
      id: "praca-tubos",
      name: "Praça do Tubos (CIC)",
      city: "Curitiba",
      address: "CIC — Curitiba/PR",
      sports: ["Futebol"],
      lat: -25.51,
      lng: -49.34,
      photoUrl: "",
    },
    {
      id: "parque-volei",
      name: "Praça do Vôlei (CIC)",
      city: "Curitiba",
      address: "CIC — Curitiba/PR",
      sports: ["Vôlei", "Basquete"],
      lat: -25.507,
      lng: -49.345,
      photoUrl: "",
    },
  ];

  writeLS(LS_COURTS, seed);
  return seed;
}

export function listCourts() {
  return ensureSeedCourts();
}

export function getCourtById(courtId) {
  const courts = ensureSeedCourts();
  return courts.find((c) => String(c.id) === String(courtId)) || null;
}

// ---------------------------------------------
// Presença (check-in) com expiração
// ---------------------------------------------
function readPresenceMap() {
  return readLS(LS_PRESENCE, {});
}
function writePresenceMap(map) {
  writeLS(LS_PRESENCE, map);
}

export function listPresence(courtId) {
  const map = readPresenceMap();
  const list = Array.isArray(map[courtId]) ? map[courtId] : [];

  const cleaned = list.filter((p) => (p?.expiresAt || 0) > now());
  if (cleaned.length !== list.length) {
    map[courtId] = cleaned;
    writePresenceMap(map);
  }
  return cleaned;
}

export function isUserPresent(courtId, userId) {
  const list = listPresence(courtId);
  return list.some((p) => String(p.userId) === String(userId));
}

// ---------------------------------------------
// Social Stats (XP/Level/Checkins)
// ---------------------------------------------
function readSocialMap() {
  return readLS(LS_SOCIAL, {});
}
function writeSocialMap(map) {
  writeLS(LS_SOCIAL, map);
}
function ensureUserSocial(userId) {
  const map = readSocialMap();
  if (!map[userId]) {
    map[userId] = {
      xp: 0,
      level: 1,
      totalCheckins: 0,
      favoritesMap: {},
      last: [],
    };
    writeSocialMap(map);
  }
  return map[userId];
}
function calcLevelFromXp(xp) {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 450) return 3;
  if (xp < 700) return 4;
  if (xp < 1000) return 5;
  return 6 + Math.floor((xp - 1000) / 500);
}
function socialAddCheckin(userId, courtId) {
  if (!userId || !courtId) return;

  const court = getCourtById(courtId);
  const map = readSocialMap();
  const s = ensureUserSocial(userId);

  const gain = 10;
  s.xp = (s.xp || 0) + gain;
  s.level = calcLevelFromXp(s.xp);

  s.totalCheckins = (s.totalCheckins || 0) + 1;

  s.favoritesMap = s.favoritesMap || {};
  s.favoritesMap[courtId] = (s.favoritesMap[courtId] || 0) + 1;

  s.last = Array.isArray(s.last) ? s.last : [];
  s.last.unshift({
    courtId,
    name: court?.name || String(courtId),
    at: now(),
  });
  s.last = s.last.slice(0, 20);

  map[userId] = s;
  writeSocialMap(map);
}

export function checkIn(courtId, user, { ttlMinutes = 20 } = {}) {
  const map = readPresenceMap();
  const list = Array.isArray(map[courtId]) ? map[courtId] : [];

  const expiresAt = now() + ttlMinutes * 60 * 1000;

  const next = [
    ...list.filter((p) => String(p.userId) !== String(user?.id)),
    {
      userId: user?.id,
      name: user?.name || "Jogador",
      avatar: user?.avatar || "",
      position: user?.position || "",
      level: user?.level || "Médio",
      checkedAt: now(),
      expiresAt,
    },
  ];

  map[courtId] = next;
  writePresenceMap(map);

  socialAddCheckin(user?.id, courtId);

  return next;
}

export function checkOut(courtId, userId) {
  const map = readPresenceMap();
  const list = Array.isArray(map[courtId]) ? map[courtId] : [];
  const next = list.filter((p) => String(p.userId) !== String(userId));
  map[courtId] = next;
  writePresenceMap(map);
  return next;
}

// ---------------------------------------------
// Chat
// ---------------------------------------------
function readChatMap() {
  return readLS(LS_CHAT, {});
}
function writeChatMap(map) {
  writeLS(LS_CHAT, map);
}

export function listMessages(courtId, { limit = 60 } = {}) {
  const map = readChatMap();
  const list = Array.isArray(map[courtId]) ? map[courtId] : [];
  return list.slice(-limit);
}

export function sendMessage(courtId, user, text) {
  const map = readChatMap();
  const list = Array.isArray(map[courtId]) ? map[courtId] : [];

  const clean = String(text || "").trim();
  if (!clean) return list;

  const msg = {
    id: `${now()}-${Math.random().toString(16).slice(2)}`,
    at: now(),
    userId: user?.id,
    name: user?.name || "Jogador",
    avatar: user?.avatar || "",
    text: clean,
  };

  const next = [...list, msg];
  map[courtId] = next;
  writeChatMap(map);
  return next;
}

// ---------------------------------------------
// Geo helpers
// ---------------------------------------------
export function distanceMeters(a, b) {
  if (!a || !b) return 999999;
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat); // ✅ FIX: era a.lat (bug)

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

export function getMyLocation({ timeout = 8000, enableHighAccuracy = true } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy, timeout }
    );
  });
}

export function canCheckInByDistance(userCoords, courtCoords, { maxMeters = 150 } = {}) {
  if (!userCoords || !courtCoords) return { ok: false, distance: null };
  const distance = distanceMeters(userCoords, courtCoords);
  return { ok: distance <= maxMeters, distance };
}

// =====================================================
// PERFIL PÚBLICO (Lite) — LocalStorage
// =====================================================
function readProfiles() {
  return readLS(LS_PROFILES, {});
}
function writeProfiles(map) {
  writeLS(LS_PROFILES, map);
}

function readUsernameIndex() {
  return readLS(LS_USERNAMES, {});
}
function writeUsernameIndex(map) {
  writeLS(LS_USERNAMES, map);
}

export function normalizeUsername(input) {
  let u = String(input || "").trim();
  if (!u) return "";

  if (u.startsWith("@")) u = u.slice(1);
  u = u.trim().toLowerCase();

  u = u.replace(/[^a-z0-9_.]/g, "");

  if (u.length < 3) return "";
  if (u.length > 20) u = u.slice(0, 20);

  return u;
}

export function getPublicProfile(userId) {
  if (!userId) return null;
  const map = readProfiles();
  return map[userId] || null;
}

export function getUserIdByUsername(usernameOrAt) {
  const idx = readUsernameIndex();
  const u = normalizeUsername(usernameOrAt);
  if (!u) return null;
  return idx[u] || null;
}

export function upsertPublicProfile(userId, patch) {
  if (!userId) return null;

  const map = readProfiles();
  const idx = readUsernameIndex();
  const prev = map[userId] || {};

  const next = { ...prev, ...patch };

  if (next.name != null) next.name = String(next.name).trim();
  if (next.city != null) next.city = String(next.city).trim();
  if (next.bairro != null) next.bairro = String(next.bairro).trim();
  if (next.position != null) next.position = String(next.position).trim();
  if (next.level != null) next.level = String(next.level).trim();
  if (next.foot != null) next.foot = String(next.foot).trim();
  if (next.bio != null) next.bio = String(next.bio).trim();
  if (next.avatar != null) next.avatar = String(next.avatar).trim();

  if (patch?.tags != null) {
    next.tags = Array.isArray(patch.tags)
      ? patch.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
      : String(patch.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12);
  }

  if (patch?.username != null) {
    const desired = normalizeUsername(patch.username);

    const prevNorm = normalizeUsername(prev.username);
    if (prevNorm && prevNorm !== desired && idx[prevNorm] === userId) {
      delete idx[prevNorm];
    }

    if (!desired) {
      next.username = "";
    } else {
      const takenBy = idx[desired];
      if (takenBy && String(takenBy) !== String(userId)) {
        throw new Error("Esse @username já está em uso 😬");
      }
      idx[desired] = userId;
      next.username = desired;
    }

    writeUsernameIndex(idx);
  }

  map[userId] = next;
  writeProfiles(map);

  return next;
}

/**
 * ✅ Garante que o user que vem do auth (/me) exista no perfil público,
 * sem sobrescrever o que o usuário já editou (username, bio, tags etc.).
 * Também sincroniza snapshot pro Social Graph (busca).
 */
export function ensurePublicProfileFromAuth(authUser) {
  const userId = authUser?.id;
  if (!userId) return null;

  const prev = getPublicProfile(userId) || {};

  const patch = {
    // só preenche se estiver vazio no perfil salvo
    name: prev.name ? prev.name : authUser?.name || "Jogador",
    avatar: prev.avatar ? prev.avatar : authUser?.avatar || "",
    city: prev.city ? prev.city : authUser?.city || "Curitiba",
    bairro: prev.bairro ? prev.bairro : authUser?.bairro || "",
    position: prev.position ? prev.position : authUser?.position || "Meia",
    level: prev.level ? prev.level : authUser?.level || "Médio",
    foot: prev.foot ? prev.foot : authUser?.foot || "Destro",
  };

  const updated = upsertPublicProfile(userId, patch);
  syncSocialProfile(userId, updated);
  return updated;
}

// =====================================================
// SOCIAL GRAPH (Friends / Requests / Follow + Snapshots)
// =====================================================
function readSocialGraph() {
  return readLS(LS_SOCIAL_GRAPH, {
    profiles: {}, // userId -> snapshot
    follows: {}, // userId -> [targetId]
    requests: {}, // userId -> [{fromId, at}]
    friends: {}, // userId -> [friendId]
  });
}

function writeSocialGraph(data) {
  writeLS(LS_SOCIAL_GRAPH, data);
}

// ✅ o que faz aparecer na busca
function ensureSocialSnapshot(userId) {
  if (!userId) return null;

  const s = readSocialGraph();
  const uid = String(userId);

  if (s.profiles?.[uid]) return s.profiles[uid];

  const p = getPublicProfile(uid) || {};
  const snap = {
    userId: uid,
    name: p.name || "Jogador",
    username: normalizeUsername(p.username) || "",
    avatar: p.avatar || "",
    city: p.city || "Curitiba",
    bairro: p.bairro || "",
    position: p.position || "",
    level: p.level || "",
    updatedAt: now(),
  };

  s.profiles[uid] = snap;
  writeSocialGraph(s);
  return snap;
}

export function syncSocialProfile(userId, updatedProfile) {
  if (!userId) return null;

  // index username -> userId
  const idx = readUsernameIndex();
  const u = normalizeUsername(updatedProfile?.username);

  Object.keys(idx).forEach((key) => {
    if (String(idx[key]) === String(userId) && key !== u) delete idx[key];
  });
  if (u) idx[u] = userId;
  writeUsernameIndex(idx);

  // snapshot pro social graph
  const s = readSocialGraph();
  s.profiles[String(userId)] = {
    userId: String(userId),
    name: updatedProfile?.name || "",
    username: u || "",
    avatar: updatedProfile?.avatar || "",
    city: updatedProfile?.city || "",
    bairro: updatedProfile?.bairro || "",
    position: updatedProfile?.position || "",
    level: updatedProfile?.level || "",
    updatedAt: now(),
  };
  writeSocialGraph(s);

  return s.profiles[String(userId)];
}

export function searchPlayers(query, { limit = 20, excludeUserId = null } = {}) {
  const q = String(query || "").trim().toLowerCase();
  const s = readSocialGraph();

  if (excludeUserId) ensureSocialSnapshot(excludeUserId);

  const list = Object.values(s.profiles || {});

  return list
    .filter((p) => (excludeUserId ? String(p.userId) !== String(excludeUserId) : true))
    .filter((p) => {
      if (!q) return true;
      const hay = `${p.username} ${p.name} ${p.city} ${p.bairro}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, limit);
}

export function getSocialProfiles(userIds = []) {
  const s = readSocialGraph();
  return (userIds || []).map((id) => {
    const uid = String(id);
    return (
      s.profiles?.[uid] ||
      ensureSocialSnapshot(uid) || { userId: uid, name: "Jogador", username: "", avatar: "", city: "" }
    );
  });
}

// ------- FOLLOW -------
export function getFollowing(userId) {
  const s = readSocialGraph();
  return uniq(s.follows?.[String(userId)] || []);
}

export function getFollowers(userId) {
  const s = readSocialGraph();
  const id = String(userId);
  const out = [];
  for (const [u, list] of Object.entries(s.follows || {})) {
    if ((list || []).map(String).includes(id)) out.push(String(u));
  }
  return uniq(out);
}

export function isFollowing(userId, targetId) {
  return getFollowing(userId).includes(String(targetId));
}

export function followUser(userId, targetId) {
  const s = readSocialGraph();
  const uid = String(userId);
  const tid = String(targetId);
  if (!uid || !tid || uid === tid) return false;

  ensureSocialSnapshot(uid);
  ensureSocialSnapshot(tid);

  const list = uniq([...(s.follows?.[uid] || []), tid]);
  s.follows[uid] = list;
  writeSocialGraph(s);
  return true;
}

export function unfollowUser(userId, targetId) {
  const s = readSocialGraph();
  const uid = String(userId);
  const tid = String(targetId);
  s.follows[uid] = (s.follows?.[uid] || []).map(String).filter((x) => x !== tid);
  writeSocialGraph(s);
  return true;
}

// ------- FRIEND REQUESTS -------
export function listFriendRequests(userId) {
  const s = readSocialGraph();
  return (s.requests?.[String(userId)] || []).slice().reverse();
}

export function listFriends(userId) {
  const s = readSocialGraph();
  return uniq(s.friends?.[String(userId)] || []);
}

export function areFriends(a, b) {
  const s = readSocialGraph();
  const A = String(a);
  const B = String(b);
  const list = (s.friends?.[A] || []).map(String);
  return list.includes(B);
}

export function hasPendingRequest(fromId, toId) {
  const s = readSocialGraph();
  const list = s.requests?.[String(toId)] || [];
  return list.some((r) => String(r.fromId) === String(fromId));
}

export function sendFriendRequest(fromId, toId) {
  const s = readSocialGraph();
  const fid = String(fromId);
  const tid = String(toId);
  if (!fid || !tid || fid === tid) return false;

  ensureSocialSnapshot(fid);
  ensureSocialSnapshot(tid);

  if (areFriends(fid, tid)) return true;
  if (hasPendingRequest(fid, tid)) return true;

  const list = s.requests?.[tid] || [];
  list.push({ fromId: fid, at: now() });
  s.requests[tid] = list;

  writeSocialGraph(s);
  return true;
}

export function acceptFriendRequest(userId, fromId) {
  const s = readSocialGraph();
  const uid = String(userId);
  const fid = String(fromId);

  ensureSocialSnapshot(uid);
  ensureSocialSnapshot(fid);

  s.requests[uid] = (s.requests?.[uid] || []).filter((r) => String(r.fromId) !== fid);

  s.friends[uid] = uniq([...(s.friends?.[uid] || []), fid]);
  s.friends[fid] = uniq([...(s.friends?.[fid] || []), uid]);

  writeSocialGraph(s);
  return true;
}

export function rejectFriendRequest(userId, fromId) {
  const s = readSocialGraph();
  const uid = String(userId);
  const fid = String(fromId);
  s.requests[uid] = (s.requests?.[uid] || []).filter((r) => String(r.fromId) !== fid);
  writeSocialGraph(s);
  return true;
}

export function removeFriend(userId, friendId) {
  const s = readSocialGraph();
  const uid = String(userId);
  const fid = String(friendId);

  s.friends[uid] = (s.friends?.[uid] || []).map(String).filter((x) => x !== fid);
  s.friends[fid] = (s.friends?.[fid] || []).map(String).filter((x) => x !== uid);

  writeSocialGraph(s);
  return true;
}

// =====================================================
// Social stats (retorna favorites/last)
// =====================================================
export function getSocialStats(userId) {
  if (!userId) return null;

  const map = readSocialMap();
  const s = map[userId] || ensureUserSocial(userId);

  const favoritesMap = s.favoritesMap || {};
  const favList = Object.keys(favoritesMap)
    .map((courtId) => {
      const c = getCourtById(courtId);
      return {
        courtId,
        count: favoritesMap[courtId] || 0,
        name: c?.name || String(courtId),
        address: c?.address || "",
      };
    })
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 8);

  return {
    xp: s.xp || 0,
    level: s.level || 1,
    totalCheckins: s.totalCheckins || 0,
    favorites: favList,
    last: Array.isArray(s.last) ? s.last : [],
  };
}

// =====================================================
// ADMIN CRUD — Courts
// =====================================================
function uid(prefix = "court") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createCourt(payload) {
  const courts = ensureSeedCourts();

  const court = {
    id: payload?.id || uid("praca"),
    name: String(payload?.name || "").trim(),
    city: String(payload?.city || "").trim(),
    address: String(payload?.address || "").trim(),
    sports: Array.isArray(payload?.sports) ? payload.sports : [],
    lat: payload?.lat === "" || payload?.lat == null ? null : Number(payload.lat),
    lng: payload?.lng === "" || payload?.lng == null ? null : Number(payload.lng),
    photoUrl: String(payload?.photoUrl || "").trim(),
  };

  const next = [court, ...courts];
  localStorage.setItem(LS_COURTS, JSON.stringify(next));
  return court;
}

export function updateCourt(courtId, patch) {
  const courts = ensureSeedCourts();

  const next = courts.map((c) => {
    if (String(c.id) !== String(courtId)) return c;

    const updated = {
      ...c,
      ...patch,
      name: patch?.name != null ? String(patch.name).trim() : c.name,
      city: patch?.city != null ? String(patch.city).trim() : c.city,
      address: patch?.address != null ? String(patch.address).trim() : c.address,
      photoUrl: patch?.photoUrl != null ? String(patch.photoUrl).trim() : c.photoUrl,
    };

    updated.lat = patch?.lat === "" || patch?.lat == null ? updated.lat : Number(patch.lat);
    updated.lng = patch?.lng === "" || patch?.lng == null ? updated.lng : Number(patch.lng);

    if (patch?.sports != null) {
      updated.sports = Array.isArray(patch.sports)
        ? patch.sports
        : String(patch.sports)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }

    return updated;
  });

  localStorage.setItem(LS_COURTS, JSON.stringify(next));
  return next.find((c) => String(c.id) === String(courtId)) || null;
}

export function deleteCourtById(courtId) {
  const courts = ensureSeedCourts();
  const next = courts.filter((c) => String(c.id) !== String(courtId));
  localStorage.setItem(LS_COURTS, JSON.stringify(next));
  return true;
}
