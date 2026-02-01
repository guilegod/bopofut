import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";
import TopProfileHeader from "./components/layout/TopProfileHeader.jsx";


import Home from "./views/Home/Home.jsx";
import MatchDetails from "./views/MatchDetails/MatchDetails.jsx";
import ProfileHybrid from "./views/Profile/ProfileHybrid.jsx";
//import ProfileV2 from "./views/Profile/ProfileV2.jsx";
import Wallet from "./views/Wallet/Wallet.jsx";
import MyMatches from "./views/MyMatches/MyMatches.jsx";
import Friends from "./views/Friends/Friends.jsx";
import Ranking from "./views/Ranking/Ranking.jsx";
import EditProfile from "./views/EditProfile/EditProfile.jsx";
import MatchCreator from "./views/MatchCreator/MatchCreator.jsx";
import ArenaPublicPage from "./views/Arena/ArenaPublicPage.jsx";
import ArenaCourtSettings from "./views/Arena/ArenaCourtSettings.jsx";


// ✅ Public Courts (Praças)
import { SquaresHome, SquarePage, LiveNow } from "./modules/publicSquares";

// ✅ Owner (Organizador)
import OwnerDashboard from "./views/OwnerManagement/OwnerDashboard.jsx";

// ✅ Arena (Estabelecimento)
import ArenaDashboard from "./views/Arena/ArenaDashboard.jsx";
import ArenaAgenda from "./views/Arena/ArenaAgenda.jsx";

// ✅ Auth Views
import Login from "./views/Auth/Login.jsx";
import Register from "./views/Auth/Register.jsx";
import ForgotPassword from "./views/Auth/ForgotPassword.jsx";
import ResetPassword from "./views/Auth/ResetPassword.jsx";
import Landing from "./pages/Landing/Landing.jsx";
import Maintenance from "./pages/Maintenance/Maintenance.jsx";



// ✅ Auth Service
import {
  getToken,
  setToken,
  clearToken,
  login as apiLogin,
  register as apiRegister,
  me as apiMe,
} from "./services/authService.js";

import { apiRequest } from "./services/api.js";
import { mockUsers } from "./mockData.js";

// ✅ Modal Admin da Pelada
import MatchAdminModal from "./views/MatchAdmin/modals/MatchAdminModal.jsx";

// --------------------------------------------
// Helpers
// --------------------------------------------
function cleanText(v) {
  return String(v ?? "").replace(/\r?\n/g, "").trim();
}

/**
 * 🔥 FIX: apiRequest às vezes não retorna array direto.
 * Pode vir: array, {data:[]}, {matches:[]}, {courts:[]}, {items:[]}, string JSON...
 */
function extractArrayResponse(raw, preferredKeys = []) {
  try {
    let data = raw;

    // se vier string JSON
    if (typeof data === "string") {
      const s = data.trim();
      if (s.startsWith("[") || s.startsWith("{")) data = JSON.parse(s);
    }

    // array direto
    if (Array.isArray(data)) return data;

    // tenta algumas chaves comuns primeiro
    for (const k of preferredKeys) {
      if (Array.isArray(data?.[k])) return data[k];
    }

    // tenta chaves padrão
    const fallbacks = ["data", "items", "results", "rows", "matches", "courts"];
    for (const k of fallbacks) {
      if (Array.isArray(data?.[k])) return data[k];
    }

    return [];
  } catch (e) {
    console.warn("extractArrayResponse falhou:", e);
    return [];
  }
}

// UI trabalha com "fut7" / "futsal"
function inferCourtTypeFromName(name) {
  const t = cleanText(name).toLowerCase();
  if (t.includes("futsal")) return "futsal";
  if (t.includes("fut7")) return "fut7";
  if (t.includes("sint") || t.includes("sintético") || t.includes("sintetico")) return "fut7";
  return "";
}

// API / backend exige ENUM "FUT7" / "FUTSAL"
function toApiMatchType(v) {
  const t = cleanText(v).toLowerCase();
  if (t === "futsal" || t === "fut_salao" || t === "salão" || t === "salao") return "FUTSAL";
  return "FUT7"; // default
}

// Converter ENUM vindo do backend -> UI
function fromApiMatchType(v) {
  const t = cleanText(v).toUpperCase();
  if (t === "FUTSAL") return "futsal";
  return "fut7";
}

function normalizeCourt(c) {
  const idRaw = String(c?.id ?? "");
  const nameRaw = String(c?.name ?? "");

  const uiId = cleanText(idRaw);
  const uiName = cleanText(nameRaw);

  const displayName = uiName
    .replace(/\((.*?)\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const type = inferCourtTypeFromName(uiName) || inferCourtTypeFromName(uiId) || "fut7";

  return {
    ...c,
    uiId,
    uiName,
    displayName,
    type,

    // mantém raw como veio do backend, mas a UI usa uiId/uiName
    id: idRaw,
    name: nameRaw,

    city: cleanText(c?.city || ""),
    address: cleanText(c?.address || ""),
  };
}

function toUIFromApiMatch(m) {
  const d = m?.date ? new Date(m.date) : null;

  const dateLabel = d
    ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : "—";

  const timeLabel = d
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return {
    id: m.id,
    title: m.title,

    date: dateLabel,
    time: timeLabel,
    dateISO: m?.date || null,

    courtId: m?.courtId ?? null,
    organizerId: m.organizerId,

    maxPlayers: m?.maxPlayers ?? 14,
    pricePerPlayer:
  m?.pricePerPlayer !== undefined && m?.pricePerPlayer !== null
    ? Number(m.pricePerPlayer)
    : (m?.price !== undefined && m?.price !== null ? Number(m.price) : null),

    presences: Array.isArray(m?.presences) ? m.presences : [],
    distance: m?.distance ?? 0,
    messages: Array.isArray(m?.messages) ? m.messages : [],

    court: m.court || null,
    admin: m.admin || undefined,

    // ✅ UI sempre em lowercase
    type: fromApiMatchType(m?.type || "FUT7"),

    // ✅ endereço da partida (override) ou fallback do backend
    matchAddress: m?.matchAddress || m?.address || "",
  };
}

function buildMatchISOFromPayload(payload) {
  const timeStr = String(payload?.time || "19:00");
  const [hhRaw, mmRaw] = timeStr.split(":");
  const hh = Number(hhRaw || 19);
  const mm = Number(mmRaw || 0);

  let baseDate = null;

  const iso = cleanText(payload?.dateISO || "");
  if (iso) {
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    if (y && m && d) baseDate = new Date(y, m - 1, d, 12, 0, 0, 0);
  }

  if (!baseDate) {
    baseDate = new Date();
    baseDate.setHours(12, 0, 0, 0);
    const label = String(payload?.dateLabel || payload?.date || "Hoje");
    if (label === "Amanhã") baseDate.setDate(baseDate.getDate() + 1);
  }

  const dt = new Date(baseDate);
  dt.setHours(hh, mm, 0, 0);

  return dt.toISOString();
}

function isManualCourtId(v) {
  const s = cleanText(v).toLowerCase();
  return !s || s === "manual" || s === "__manual__" || s === "none" || s === "null" || s === "undefined";
}

export default function App() {
  // =========================================================
  // USER BASE
  // =========================================================
  // =======================
  // Theme (global) — light/dark
  // =======================

const MAINTENANCE = true; // 🔥 trocar para false quando quiser liberar

  const location = useLocation();
  const navigate = useNavigate();

  const routeMode = useMemo(() => {
    const p = (location?.pathname || "/").toLowerCase();
    if (p.startsWith("/painel")) return "panel";
    if (p.startsWith("/app")) return "app";
    return "landing";
  }, [location?.pathname]);



  const [theme, setTheme] = useState(() => localStorage.getItem("borapo_theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "";
    localStorage.setItem("borapo_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function safeCopy(text, ok = "Copiado ✅") {
    try {
      navigator.clipboard?.writeText(String(text || ""));
      alert(ok);
    } catch {
      alert("Não consegui copiar automaticamente 😬");
    }
  }


  const baseUser = useMemo(
    () => ({
      id: null,
      name: "",
      role: "user",
      avatar: "https://picsum.photos/seed/user/200",
      isVerified: false,
      position: "Meia",
      walletBalance: 0,
      stats: { goals: 0, assists: 0, gamesPlayed: 0 },
      unlockedAchievementIds: [],
      email: "",
      phone: "",
    }),
    []
  );

  const [user, setUser] = useState(baseUser);
  const users = useMemo(() => mockUsers, []);

  // =========================================================
  // VIEW CONTROL
  // =========================================================
  const [view, setView] = useState("login");
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [adminMatchId, setAdminMatchId] = useState(null);
  const [arenaSelectedCourtId, setArenaSelectedCourtId] = useState(null);

  // ✅ Perfil público (mesmo componente)
  const [viewedUserId, setViewedUserId] = useState(null);

  const isArenaOwner = user?.role === "arena_owner";
  const isOrganizer = user?.role === "owner" || user?.role === "admin";

  // ✅ view stack (voltar inteligente — principalmente no módulo Praças)
  const [viewStack, setViewStack] = useState([]);

  function setViewWithBack(nextView, fromViewOverride = null) {
    const from = fromViewOverride || view;
    if (from && from !== nextView) {
      setViewStack((prev) => {
        const last = prev[prev.length - 1];
        if (last === from) return prev;
        return [...prev, from];
      });
    }
    setView(nextView);
  }

  function popBackOr(fallbackView) {
    setViewStack((prev) => {
      if (!prev.length) {
        setView(fallbackView);
        return prev;
      }
      const next = prev[prev.length - 1];
      setView(next || fallbackView);
      return prev.slice(0, -1);
    });
  }

  function resetBackStack() {
    setViewStack([]);
  }

  // =========================================================
  // PRAÇAS (PublicCourts) — state
  // =========================================================
  const [selectedPublicCourtId, setSelectedPublicCourtId] = useState(null);
  const [pendingDeepLinkCourtId, setPendingDeepLinkCourtId] = useState(null);

  // ✅ Arena Public Page (agrupada por arenaOwnerId)
  const [selectedArenaOwnerId, setSelectedArenaOwnerId] = useState(null);

  // captura deep link logo de cara
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const courtId = params.get("court");
      if (courtId) {
        setPendingDeepLinkCourtId(String(courtId));
        setSelectedPublicCourtId(String(courtId));
      }
    } catch {
      // ignore
    }
  }, []);

  function requireAuthOrLogin() {
    const token = getToken();
    if (!token) {
      setView("login");
      return null;
    }
    return token;
  }

  function openArenaPublic(arenaOwnerId) {
    const token = requireAuthOrLogin();
    if (!token) return;
    setSelectedArenaOwnerId(String(arenaOwnerId));
    setViewWithBack("arenaPublic", "home");
  }

  function openPublicCourt(courtId) {
    const token = requireAuthOrLogin();
    if (!token) {
      setPendingDeepLinkCourtId(String(courtId));
      setSelectedPublicCourtId(String(courtId));
      return;
    }
    setSelectedPublicCourtId(String(courtId));
    setViewWithBack("publicCourtPage");
  }

  function openPublicLiveNow() {
    const token = requireAuthOrLogin();
    if (!token) return;
    setViewWithBack("publicLiveNow");
  }

  // ✅ abrir perfil público de qualquer lugar
  function openPlayerProfile(userId, fromViewOverride = null) {
    const token = requireAuthOrLogin();
    if (!token) return;
    setViewedUserId(userId || null);
    setViewWithBack("playerProfile", fromViewOverride);
  }

  // =========================================================
  // COURTS
  // =========================================================
  const [courts, setCourts] = useState([]);
  const [courtsLoading, setCourtsLoading] = useState(false);

  async function loadCourts(token) {
    setCourtsLoading(true);
    try {
      const raw = await apiRequest("/courts", token ? { token } : undefined);
      const listRaw = extractArrayResponse(raw, ["courts"]);
      const normalized = listRaw.map(normalizeCourt);
      setCourts(normalized);
      console.log("✅ COURTS normalizadas:", normalized);
    } catch (e) {
      console.error("❌ GET /courts falhou:", e);
      setCourts([]);
    } finally {
      setCourtsLoading(false);
    }
  }

  // =========================================================
  // MATCHES
  // =========================================================
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

async function loadMatches(tokenParam) {
  setMatchesLoading(true);
  try {
    const token = String(tokenParam || getToken() || "").trim();
    const raw = await apiRequest("/matches", token ? { token } : undefined);

    // ✅ se o backend já devolve array direto
    const listRaw = Array.isArray(raw) ? raw : (raw?.matches || raw?.data || []);

    console.log("🔥 RAW /matches:", listRaw);
    console.log("🔥 RAW KEYS 0:", listRaw?.[0] ? Object.keys(listRaw[0]) : []);

    const list = (listRaw || []).map((m) => {
      const dateObj = m?.date ? new Date(m.date) : null;
      const dateValid = dateObj && !Number.isNaN(dateObj.getTime());

      const priceNum =
        m?.pricePerPlayer === 0
          ? 0
          : Number.isFinite(Number(m?.pricePerPlayer))
          ? Number(m.pricePerPlayer)
          : 0;

      const maxPlayersNum = Number.isFinite(Number(m?.maxPlayers)) ? Number(m.maxPlayers) : 14;
      const minPlayersNum = Number.isFinite(Number(m?.minPlayers)) ? Number(m.minPlayers) : 0;

      const typeLower = String(m?.type || "").toLowerCase();

      // tenta montar um "local" mesmo se court vier vazio
      const courtName =
        m?.court?.name ||
        m?.court?.title ||
        m?.court?.arena?.name ||
        (m?.courtId ? "Quadra" : "Local manual");

      const arenaName = m?.court?.arena?.name || null;

      const addr =
        m?.matchAddress ||
        m?.court?.address ||
        m?.court?.arena?.address ||
        "";

      return {
        // ✅ mantém TUDO do backend
        ...m,

        // ✅ compat UI
        title: m?.title ?? "Sem título",
        organizerId: m?.organizerId ?? m?.organizer?.id ?? null,
        courtId: m?.courtId ?? null,
        court: m?.court ?? null,

        // extras bons pra UI
        courtName,
        arenaName,
        matchAddress: addr,

        pricePerPlayer: priceNum,
        maxPlayers: maxPlayersNum,
        minPlayers: minPlayersNum,

        dateISO: dateValid ? dateObj.toISOString() : null,
        time: dateValid
          ? dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : "",
        date: dateValid
          ? dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
          : "",

        type: typeLower,
      };
    });

    setMatches(list);
    console.log("✅ MATCHES carregadas:", list);
  } catch (e) {
    console.error("❌ GET /matches falhou:", e);
    setMatches([]);
  } finally {
    setMatchesLoading(false);
  }
}




  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;

  const selectedCourt = useMemo(() => {
    if (selectedMatch?.court) return normalizeCourt(selectedMatch.court);

    const cid = selectedMatch?.courtId;
    if (!cid || isManualCourtId(cid)) return null;

    const found =
      courts.find((c) => cleanText(c.id) === cleanText(cid)) ||
      courts.find((c) => cleanText(c.uiId) === cleanText(cid)) ||
      null;

    return found ? normalizeCourt(found) : null;
  }, [selectedMatch, courts]);

  // =========================================================
  // AUTH BOOT
  // =========================================================
 useEffect(() => {
  async function boot() {
    try {
      // ✅ 1) Se veio por link de reset (/?token=xxxx), vai direto pra tela
      try {
        const params = new URLSearchParams(window.location.search);
        const resetToken = params.get("token");
        if (resetToken && String(resetToken).trim().length >= 20) {
          resetBackStack();
          setView("resetPassword");
          return;
        }
      } catch {
        // ignore
      }

      // ✅ 2) fluxo normal
      const token = getToken();

      if (!token) {
        setView("login");
        return;
      }

      const data = await apiMe(token);
      const nextUser = { ...baseUser, ...data.user };
      setUser(nextUser);

      if (pendingDeepLinkCourtId) {
        setSelectedPublicCourtId(pendingDeepLinkCourtId);
        resetBackStack();
        setView("publicCourtPage");
        setPendingDeepLinkCourtId(null);
      } else {
      resetBackStack();

        if (routeMode === "panel") {
          // painel do dono: arena_owner -> arenaPanel | owner/admin -> OwnerDashboard | outros -> home
          if (nextUser.role === "arena_owner") setView("arenaPanel");
          else if (nextUser.role === "owner" || nextUser.role === "admin") setView("ownerDashboard");
          else setView("home");
        } else {
          // app normal
          setView(nextUser.role === "arena_owner" ? "arenaPanel" : "home");
        }
      }

      await loadCourts(token);
      await loadMatches(token);
    } catch {
      clearToken();
      setView("login");
    } finally {
      setAuthLoading(false);
    }
  }

  boot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pendingDeepLinkCourtId]);


  // =========================================================
  // AUTH HANDLERS
  // =========================================================
  async function handleLogin({ email, password }) {
    const data = await apiLogin({ email, password });
    setToken(data.token);

    const nextUser = { ...baseUser, ...data.user };
    setUser(nextUser);

    if (pendingDeepLinkCourtId) {
      setSelectedPublicCourtId(pendingDeepLinkCourtId);
      resetBackStack();
      setView("publicCourtPage");
      setPendingDeepLinkCourtId(null);
    } else {
      resetBackStack();
      setView(nextUser.role === "arena_owner" ? "arenaPanel" : "home");
    }

    await loadCourts(data.token);
    await loadMatches(data.token);
  }

  async function handleRegister({ name, email, password }) {
    const data = await apiRegister({ name, email, password });
    setToken(data.token);

    const nextUser = { ...baseUser, ...data.user };
    setUser(nextUser);

    if (pendingDeepLinkCourtId) {
      setSelectedPublicCourtId(pendingDeepLinkCourtId);
      resetBackStack();
      setView("publicCourtPage");
      setPendingDeepLinkCourtId(null);
    } else {
      resetBackStack();
      setView(nextUser.role === "arena_owner" ? "arenaPanel" : "home");
    }

    await loadCourts(data.token);
    await loadMatches(data.token);
  }

  function handleLogout() {
    clearToken();
    setUser(baseUser);
    setSelectedMatchId(null);
    setAdminMatchId(null);
    setArenaSelectedCourtId(null);
    setSelectedArenaOwnerId(null);
    setMatches([]);
    setCourts([]);
    setSelectedPublicCourtId(null);
    setPendingDeepLinkCourtId(null);
    setViewedUserId(null);
    resetBackStack();
    setView("login");
  }

  // =========================================================
  // NAV HELPERS
  // =========================================================
  function openMatch(matchId) {
    const token = requireAuthOrLogin();
    if (!token) return;
    setSelectedMatchId(matchId);
    setViewWithBack("matchDetails");
  }

  function openMatchCreator() {
    const token = requireAuthOrLogin();
    if (!token) return;
    setViewWithBack("matchCreator");
  }

  function goBack() {
    // ✅ Arena Public
    if (view === "arenaPublic") {
      setSelectedArenaOwnerId(null);
      return popBackOr("home");
    }

    // ✅ PublicCourts (voltar inteligente)
    if (view === "publicCourtPage" || view === "publicLiveNow") {
      return popBackOr("publicCourtsHome");
    }
    if (view === "publicCourtsHome") {
      return popBackOr(isArenaOwner ? "arenaPanel" : "home");
    }

    // ✅ Perfil público
    if (view === "playerProfile") {
      setViewedUserId(null);
      return popBackOr("profile");
    }

    // ✅ Arena stack
    if (
      view === "arenaAgenda" ||
      view === "arenaFinance" ||
      view === "arenaPromotions" ||
      view === "arenaCourtSettings" ||
      view === "arenaTournaments" ||
      view === "accountSettings"
    ) {
      return setView("arenaPanel");
    }

    if (view === "profile" && isArenaOwner) return setView("arenaPanel");

    if (view === "ownerFinance" || view === "ownerPromotions" || view === "accountSettings") {
      if (!isArenaOwner) return setView("ownerDashboard");
    }
    if (view === "ownerDashboard") return setView("profile");

    if (view === "matchDetails") return popBackOr("home");
    if (view === "editProfile") return setView("profile");
    if (view === "wallet") return setView("profile");
    if (view === "matchCreator") return popBackOr("home");
    if (view === "register") return setView("login");
    if (view === "forgotPassword") return setView("login");


    return setView(isArenaOwner ? "arenaPanel" : "home");
  }

  function onNav(next) {
    const token = requireAuthOrLogin();
    if (!token) return;

    const jump = (v) => {
      resetBackStack();
      setView(v);
    };

    if (isArenaOwner) {
      if (next === "arenaPanel") return jump("arenaPanel");
      if (next === "arenaAgenda") return jump("arenaAgenda");
      if (next === "arenaFinance") return jump("arenaFinance");
      if (next === "profile") return jump("profile");
      return jump("arenaPanel");
    }

    // ✅ PublicCourts nav
    if (next === "publicCourts") return jump("publicCourtsHome");
    if (next === "publicLiveNow") return jump("publicLiveNow");

    if (next === "home") return jump("home");
    if (next === "matches") return jump("myMatches");
    if (next === "create") return jump("matchCreator");
    if (next === "profile") return jump("profile");
    if (next === "wallet") return jump("wallet");

    jump("home");
  }

  function onNewMessage(msg) {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== selectedMatchId) return m;
        const next = Array.isArray(m.messages) ? [...m.messages, msg] : [msg];
        return { ...m, messages: next };
      })
    );
  }

  function onManageStats(matchId) {
    setAdminMatchId(matchId);
  }

  function onSaveMatchStats(matchId, playerStats, highlights, admin, discipline) {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          playerStats: playerStats || {},
          highlights: highlights || [],
          admin: admin || {},
          discipline: discipline || {},
        };
      })
    );
  }

  function onSaveProfile(updatedUser) {
    setUser((prev) => ({ ...prev, ...updatedUser }));
    setView("profile");
  }

  // =========================================================
  // ✅ CREATE MATCH (POST /matches) — COM ENUM + MANUAL
  // =========================================================
  // =========================================================
// ✅ CREATE MATCH (POST /matches) — payload direto do MatchCreator
// =========================================================
async function onCreateMatch(payload) {
  const token = requireAuthOrLogin();
  if (!token) return;

  const cleanText = (v) => String(v ?? "").trim();

  const toOptionalInt = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return undefined;
    const n = Number(String(s).replace(",", "."));
    if (!Number.isFinite(n)) return undefined;
    return Math.trunc(n);
  };

  // ✅ MatchCreator manda payload.date como ISO completo
  const startedAtISO = payload?.date ? String(payload.date) : "";

  // Validação robusta (aceita ISO completo)
  if (!startedAtISO || Number.isNaN(new Date(startedAtISO).getTime())) {
    console.log("DEBUG invalid date payload:", payload);
    alert("Escolha uma data válida.");
    return;
  }

  const sentId = cleanText(payload?.courtId || "");
  const isManual = !sentId; // MatchCreator manda null quando manual

  const title = cleanText(payload?.title || "");
  const matchAddress = cleanText(payload?.matchAddress || "");

  const type = cleanText(payload?.type || payload?.courtType || "FUT7").toUpperCase();

  const maxPlayersVal = toOptionalInt(payload?.maxPlayers);
  const pricePerPlayerVal = toOptionalInt(payload?.pricePerPlayer);

  const bodyBase = {
    title: title || "Sem título",
    date: startedAtISO, // ✅ é isso que o backend precisa
    type,
    ...(Number.isFinite(maxPlayersVal) ? { maxPlayers: maxPlayersVal } : {}),
    ...(Number.isFinite(pricePerPlayerVal) ? { pricePerPlayer: pricePerPlayerVal } : {}),
  };

  // ✅ MANUAL
  if (isManual) {
    if (!title) return alert("Informe o nome da partida.");
    if (!matchAddress) return alert("Informe o local (endereço).");

    const created = await apiRequest("/matches", {
      method: "POST",
      token,
      body: { ...bodyBase, courtId: null, matchAddress },
    });

    await loadMatches(token);
    setSelectedMatchId(created?.id || null);
    setView("matchDetails");
    return;
  }

  // ✅ QUADRA
  const created = await apiRequest("/matches", {
    method: "POST",
    token,
    body: { ...bodyBase, courtId: sentId, matchAddress: matchAddress || null },
  });

  await loadMatches(token);
  setSelectedMatchId(created?.id || null);
  setView("matchDetails");
}



  // =========================================================
  // MENU / UI
  // =========================================================
  const canCreateMatch = isOrganizer || isArenaOwner;


  const showBack =
    view === "matchDetails" ||
    view === "editProfile" ||
    view === "matchCreator" ||
    view === "register" ||
    view === "forgotPassword" ||
    view === "arenaAgenda" ||
    view === "arenaFinance" ||
    view === "arenaPromotions" ||
    view === "arenaCourtSettings" ||
    view === "arenaTournaments" ||
    view === "arenaPublic" ||
    view === "ownerDashboard" ||
    view === "ownerFinance" ||
    view === "ownerPromotions" ||
    view === "accountSettings" ||
    view === "publicCourtsHome" ||
    view === "publicCourtPage" ||
    view === "publicLiveNow" ||
    view === "playerProfile";

  const title =
    view === "login"
      ? "Entrar"
      : view === "register"
      ? "Criar conta"
      : view === "forgotPassword"
      ? "Recuperar senha"
      : view === "arenaPanel"
      ? "Painel da Arena"
      : view === "arenaAgenda"
      ? "Agenda da Arena"
      : view === "arenaFinance"
      ? "Financeiro"
      : view === "arenaPromotions"
      ? "Promoções"
      : view === "arenaCourtSettings"
      ? "Quadras"
      : view === "arenaTournaments"
      ? "Campeonatos"
      : view === "arenaPublic"
      ? "Arena"
      : view === "ownerDashboard"
      ? "Painel do Organizador"
      : view === "ownerFinance"
      ? "Financeiro"
      : view === "ownerPromotions"
      ? "Promoções"
      : view === "accountSettings"
      ? "Configurações"
      : view === "publicCourtsHome"
      ? "Praças"
      : view === "publicLiveNow"
      ? "Ao vivo"
      : view === "publicCourtPage"
      ? "Praça"
      : view === "home"
      ? "Bópô Fut"
      : view === "profile"
      ? "Perfil"
      : view === "playerProfile"
      ? "Jogador"
      : view === "wallet"
      ? "Wallet"
      : view === "myMatches"
      ? "Minha Agenda"
      : view === "friends"
      ? "Seu Elenco"
      : view === "ranking"
      ? "Ranking"
      : view === "editProfile"
      ? "Editar Perfil"
      : view === "matchCreator"
      ? "Criar Pelada"
      : "Bópô Fut";

  const bottomActive = isArenaOwner
    ? view
    : view === "matchCreator"
    ? "create"
    : view === "matchDetails" || view === "editProfile" || view === "playerProfile"
    ? "home"
    : view === "ownerDashboard" ||
      view === "ownerFinance" ||
      view === "ownerPromotions" ||
      view === "accountSettings" ||
      view === "publicCourtsHome" || view === "publicCourtPage" || view === "publicLiveNow"
    ? "publicCourts"
    : view;

  const isAuthView = view === "login" || view === "register" || view === "forgotPassword";
  const adminMatch = adminMatchId ? matches.find((m) => m.id === adminMatchId) || null : null;
  const loadingAny = matchesLoading || courtsLoading;

  const isProfileView = view === "profile" || view === "playerProfile";
  const profileTargetId = view === "playerProfile" ? viewedUserId : user?.id;

 

const profileHeader = (
  <TopProfileHeader
    title="PERFIL"
    onBack={goBack}
    showBack={showBack} // <- usa sua lógica real

    onCopyId={() => navigator.clipboard.writeText(user?.id || "")}
    onShare={() => navigator.clipboard.writeText(`@${user?.username || user?.id || ""}`)}

    onToggleTheme={toggleTheme}
    theme={theme}

    // ✅ AGORA SIM: navega pra views corretas
    onEditProfile={() => setView("editProfile")}
    onOpenSettings={() => setView("accountSettings")}
    onOpenWallet={() => setView("wallet")} // se quiser mostrar
    hideWalletInMenu // se quiser esconder por enquanto

    showLogout
    onLogout={handleLogout}
  />
);

if (MAINTENANCE) {
  return <Maintenance />;
}

  if (routeMode === "landing") {
    return (
      <Landing
        onEnterApp={() => navigate("/app")}
        onEnterPanel={() => navigate("/painel")}
      />
    );
  }




  return (
    <AppShell
      header={isProfileView ? profileHeader : null}
      title={title}
      showBack={showBack}
      onBack={goBack}
      active={isAuthView ? (isArenaOwner ? "arenaPanel" : "home") : bottomActive}
      onNav={onNav}
      canCreateMatch={!isAuthView && canCreateMatch}
      showNav={!isAuthView}
      isArenaOwner={!isAuthView && isArenaOwner}
      isAdmin={user?.role === "admin"}  
    >
      {authLoading ? (
        <div style={{ padding: 18, opacity: 0.75 }}>Carregando...</div>
      ) : view === "login" ? (
        <Login
  onLoginSuccess={handleLogin}
  onGoRegister={() => setView("register")}
  onGoForgotPassword={() => setView("forgotPassword")}
/>
      ) : view === "register" ? (
        <Register onRegisterSuccess={handleRegister} onGoLogin={() => setView("login")} />
      ) : view === "resetPassword" ? (
      <ResetPassword onGoLogin={() => setView("login")} />
        ) : view === "forgotPassword" ? (
  <ForgotPassword onGoLogin={() => setView("login")} />


      ) : loadingAny ? (
        <div style={{ padding: 18, opacity: 0.75 }}>Carregando {courtsLoading ? "arenas" : "partidas"}…</div>
      ) : view === "publicCourtsHome" ? (
        <SquaresHome user={user} onOpenCourt={openPublicCourt} onOpenLiveNow={openPublicLiveNow} />
      ) : view === "publicLiveNow" ? (
        <LiveNow onOpenCourt={openPublicCourt} onBack={goBack} />
      ) : view === "publicCourtPage" ? (
        <SquarePage courtId={selectedPublicCourtId} user={user} onBack={goBack} />
      ) : view === "arenaPublic" ? (
        <ArenaPublicPage
          arenaOwnerId={selectedArenaOwnerId}
          courts={courts}
          dateISO={new Date().toISOString().slice(0, 10)}
          onBack={goBack}
          onOpenMatchCreator={() => setView("matchCreator")}
        />
      ) : view === "matchDetails" && selectedMatch ? (
        <MatchDetails
          match={selectedMatch}
          court={selectedCourt}
          user={user}
          onBack={goBack}
          onManageStats={onManageStats}
          onNewMessage={onNewMessage}
          onPresenceChange={async () => {
            const token = getToken();
            await loadMatches(token);
          }}
        />
      ) : view === "profile" ? (
        <ProfileHybrid
          user={user}
          matches={matches}
          courts={courts}
          onOpenWallet={() => setView("wallet")}
          onOpenFriends={() => setView("friends")}
          onOpenRanking={() => setView("ranking")}
          onEditProfile={() => setView("editProfile")}
          onBack={() => setView(isArenaOwner ? "arenaPanel" : "home")}
          onLogout={handleLogout}
          onOpenOrganizerPanel={() => setView("ownerDashboard")}
          onOpenArenaPanel={() => setView("arenaPanel")}
          onOpenAgenda={() => {
            setArenaSelectedCourtId(null);
            setView("arenaAgenda");
          }}
          onOpenFinance={() => setView(isArenaOwner ? "arenaFinance" : "ownerFinance")}
          onOpenPromotions={() => setView(isArenaOwner ? "arenaPromotions" : "ownerPromotions")}
          onOpenAccountSettings={() => setView("accountSettings")}
          viewedUserId={null}
          onOpenPlayerProfile={(userId) => openPlayerProfile(userId, "profile")}
        />
      ) : view === "playerProfile" ? (
        <ProfileHybrid
          user={user}
          matches={matches}
          courts={courts}
          onOpenWallet={() => setView("wallet")}
          onOpenFriends={() => setView("friends")}
          onOpenRanking={() => setView("ranking")}
          onEditProfile={() => setView("editProfile")}
          onBack={goBack}
          onLogout={handleLogout}
          onOpenOrganizerPanel={() => setView("ownerDashboard")}
          onOpenArenaPanel={() => setView("arenaPanel")}
          onOpenAgenda={() => {
            setArenaSelectedCourtId(null);
            setView("arenaAgenda");
          }}
          onOpenFinance={() => setView(isArenaOwner ? "arenaFinance" : "ownerFinance")}
          onOpenPromotions={() => setView(isArenaOwner ? "arenaPromotions" : "ownerPromotions")}
          onOpenAccountSettings={() => setView("accountSettings")}
          viewedUserId={viewedUserId}
          isPublicMode
          onOpenPlayerProfile={(userId) => openPlayerProfile(userId, "playerProfile")}
        />
      ) 
       : view === "wallet" ? (
        <Wallet user={user} onBack={() => setView("profile")} />
      ) : view === "myMatches" ? (
        <MyMatches matches={matches} courts={courts} user={user} onSelectMatch={openMatch} />
      ) : view === "friends" ? (
        <Friends onBack={() => setView("profile")} />
      ) : view === "ranking" ? (
        <Ranking users={users} matches={matches} onBack={() => setView("home")} />
      ) : view === "editProfile" ? (
        <EditProfile user={user} onSave={onSaveProfile} onBack={() => setView("profile")} />
      ) : view === "accountSettings" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>⚙️ Configurações de Conta</div>
          <div style={panelSub()}>
            Aqui vamos colocar: segurança, senha, privacidade, notificações e preferências.
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={panelBtn()} onClick={() => setView("editProfile")}>
              ✎ Editar Perfil (atalho atual)
            </button>


            {isArenaOwner ? (
              <button type="button" style={panelBtn()} onClick={() => setView("arenaPanel")}>
                🏟️ Voltar ao Painel da Arena
              </button>
            ) : isOrganizer ? (
              <button type="button" style={panelBtn()} onClick={() => setView("ownerDashboard")}>
                🎯 Voltar ao Painel do Organizador
              </button>
            ) : null}
          </div>
        </div>
      ) : view === "matchCreator" ? (
         <MatchCreator
          courts={courts}
          organizerId={user.id}
          user={user}
          onCreate={onCreateMatch}
          onBack={() => setView("home")}
        />
      ) : view === "ownerDashboard" ? (
        <OwnerDashboard
          user={user}
          matches={matches.filter((m) => m.organizerId === user?.id)}
          courts={courts}
          onBack={() => setView("profile")}
          onOpenMatchCreator={() => setView("matchCreator")}
          onOpenMyMatches={() => setView("myMatches")}
          onOpenMatchAdmin={(match) => setAdminMatchId(match?.id)}
          onOpenFinance={() => setView("ownerFinance")}
          onOpenAccountSettings={() => setView("accountSettings")}
        />
      ) : view === "ownerFinance" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>💰 Financeiro do Organizador</div>
          <div style={panelSub()}>
            Aqui vamos colocar: receitas por partida, taxas, repasses, histórico e exportações.
          </div>
        </div>
      ) : view === "ownerPromotions" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>🏷️ Promoções do Organizador</div>
          <div style={panelSub()}>
            Aqui vamos colocar: cupons, regras por quadra, campanhas e tracking.
          </div>
        </div>
      ) : view === "arenaPanel" ? (
        <ArenaDashboard
          user={user}
          courts={courts}
          matches={matches}
          onBack={() => setView("profile")}
          onOpenAgenda={(court) => {
            setArenaSelectedCourtId(court?.id || null);
            setView("arenaAgenda");
          }}
          onOpenFinance={() => setView("arenaFinance")}
          onOpenPromotions={() => setView("arenaPromotions")}
          onOpenAccountSettings={() => setView("accountSettings")}
          onOpenCourtSettings={() => setView("arenaCourtSettings")}
          onOpenTournaments={() => setView("arenaTournaments")}
        />
      ) : view === "arenaAgenda" ? (
        <ArenaAgenda
          user={user}
          courts={courts}
          matches={matches}
          initialCourtId={arenaSelectedCourtId}
          onBack={() => setView("arenaPanel")}
          onOpenFinance={() => setView("arenaFinance")}
          onOpenPromotions={() => setView("arenaPromotions")}
          onOpenCourtSettings={() => setView("arenaCourtSettings")}
        />
      ) : view === "arenaFinance" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>💰 Financeiro da Arena</div>
          <div style={panelSub()}>
            Próximo: resumo de reservas, receita, comissão, mensalidade e relatórios.
          </div>
        </div>
      ) : view === "arenaPromotions" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>🏷️ Promoções da Arena</div>
          <div style={panelSub()}>
            Próximo: cupons, pacotes por quadra/horário, promoções recorrentes e vitrines.
          </div>
        </div>
      ) : view === "arenaCourtSettings" ? (
        <ArenaCourtSettings
          user={user}
          courts={courts}
          onBack={() => setView("arenaPanel")}
          onCourtsUpdated={(next) => setCourts(next)}
        />
      ) : view === "arenaTournaments" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>🏆 Campeonatos</div>
          <div style={panelSub()}>
            Próximo: criação de campeonatos, tabelas, inscrições, taxas e premiações.
          </div>
        </div>
      ) : (
        <Home
          matches={matches}
          courts={courts}
          user={user}
          canCreateMatch={isOrganizer}
          onSelectMatch={openMatch}
          onOpenRanking={() => setView("ranking")}
          onOpenMatchCreator={openMatchCreator}
          onOpenArena={openArenaPublic} // ✅ agora funciona
        />
      )}

      {adminMatch ? (
        <MatchAdminModal
          match={adminMatch}
          courts={courts}
          user={user}
          users={users}
          onClose={() => setAdminMatchId(null)}
          onSave={(playerStats, highlights, admin, discipline) => {
            onSaveMatchStats(adminMatch.id, playerStats, highlights, admin, discipline);
            setAdminMatchId(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}

function panelWrap() {
  return { padding: 24, borderRadius: 18 };
}
function panelTitle() {
  return { fontWeight: 1000, fontSize: 18, marginBottom: 6 };
}
function panelSub() {
  return { opacity: 0.8 };
}
function panelBtn() {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontWeight: 900,
    cursor: "pointer",
  };
}
