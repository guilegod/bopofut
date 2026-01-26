import { useEffect, useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell.jsx";

import Home from "./views/Home/Home.jsx";
import MatchDetails from "./views/MatchDetails/MatchDetails.jsx";
import ProfileHybrid from "./views/Profile/ProfileHybrid.jsx";
import ProfileV2 from "./views/Profile/ProfileV2.jsx";
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
  return "FUT7"; // default (Sintético)
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
    pricePerPlayer: m?.pricePerPlayer ?? m?.price ?? 30,

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
      const token = (tokenParam || getToken() || "").toString().trim();
      const raw = await apiRequest("/matches", token ? { token } : undefined);
      const listRaw = extractArrayResponse(raw, ["matches"]);
      const list = listRaw.map(toUIFromApiMatch);
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
          setView(nextUser.role === "arena_owner" ? "arenaPanel" : "home");
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

    if (view === "profileV2") return setView("profile");
    if (view === "profile" && isArenaOwner) return setView("arenaPanel");

    if (view === "ownerFinance" || view === "ownerPromotions" || view === "accountSettings") {
      if (!isArenaOwner) return setView("ownerDashboard");
    }
    if (view === "ownerDashboard") return setView("profile");

    if (view === "matchDetails") return popBackOr("home");
    if (view === "editProfile") return setView("profile");
    if (view === "wallet") return setView("profile");
    if (view === "matchCreator") return popBackOr(isArenaOwner ? "arenaPanel" : "home");
    if (view === "register") return setView("login");

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
  async function onCreateMatch(payload) {
    const token = requireAuthOrLogin();
    if (!token) return;

    const sentId = String(payload?.courtId || "");
    const sentIdClean = cleanText(sentId);

    const isManual = isManualCourtId(sentIdClean);
    const dateISO = buildMatchISOFromPayload(payload);

    const matchAddress = cleanText(payload?.matchAddress || "");
    const typeUi = cleanText(payload?.type || payload?.courtType || payload?.matchType || "fut7").toLowerCase();
    const type = toApiMatchType(typeUi);

    const bodyBase = {
      title: cleanText(payload?.title || ""),
      date: dateISO,
      type,
      maxPlayers: Number(payload?.maxPlayers ?? 14),
      pricePerPlayer: Number(payload?.pricePerPlayer ?? 30),
    };

    if (isManual) {
      if (!bodyBase.title) return alert("Informe o nome da partida.");
      if (!matchAddress) return alert("Informe o local da partida (endereço).");

      const body = { ...bodyBase, courtId: null, matchAddress };

      const created = await apiRequest("/matches", { method: "POST", token, body });
      await loadMatches(token);
      setSelectedMatchId(created?.id || null);
      setView("matchDetails");
      return;
    }

    const court =
      courts.find((c) => cleanText(c.id) === sentIdClean) ||
      courts.find((c) => cleanText(c.uiId) === sentIdClean) ||
      null;

    if (!court) {
      alert(
        "Erro: a arena selecionada não existe na lista carregada.\n\n" +
          "Dica: recarregue as arenas ou verifique se o id no banco está correto."
      );
      return;
    }

    const courtIdToSend = cleanText(court.uiId || court.id);

    const finalAddress = matchAddress || cleanText(court.address || "");
    if (!finalAddress) {
      alert(
        "Essa arena está sem endereço cadastrado.\n" +
          "Digite o endereço no campo (override) ou preencha Court.address no banco."
      );
      return;
    }

    const body = { ...bodyBase, courtId: courtIdToSend, matchAddress: matchAddress || "" };

    const created = await apiRequest("/matches", { method: "POST", token, body });
    await loadMatches(token);
    setSelectedMatchId(created?.id || null);
    setView("matchDetails");
  }

  // =========================================================
  // MENU / UI
  // =========================================================
  const canCreateMatch = isOrganizer;

  const showBack =
    view === "matchDetails" ||
    view === "editProfile" ||
    view === "matchCreator" ||
    view === "register" ||
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
    view === "profileV2" ||
    view === "publicCourtsHome" ||
    view === "publicCourtPage" ||
    view === "publicLiveNow" ||
    view === "playerProfile";

  const title =
    view === "login"
      ? "Entrar"
      : view === "register"
      ? "Criar conta"
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
      : view === "profileV2"
      ? "Perfil V2"
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
      view === "profileV2"
    ? "profile"
    : view === "publicCourtsHome" || view === "publicCourtPage" || view === "publicLiveNow"
    ? "publicCourts"
    : view;

  const isAuthView = view === "login" || view === "register";
  const adminMatch = adminMatchId ? matches.find((m) => m.id === adminMatchId) || null : null;
  const loadingAny = matchesLoading || courtsLoading;

  return (
    <AppShell
      title={title}
      showBack={showBack}
      onBack={goBack}
      active={isAuthView ? (isArenaOwner ? "arenaPanel" : "home") : bottomActive}
      onNav={onNav}
      canCreateMatch={!isAuthView && canCreateMatch}
      showNav={!isAuthView}
      isArenaOwner={!isAuthView && isArenaOwner}
    >
      {authLoading ? (
        <div style={{ padding: 18, opacity: 0.75 }}>Carregando...</div>
      ) : view === "login" ? (
        <Login onLoginSuccess={handleLogin} onGoRegister={() => setView("register")} />
      ) : view === "register" ? (
        <Register onRegisterSuccess={handleRegister} onGoLogin={() => setView("login")} />
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
          onOpenMatchCreator={openMatchCreator}
          onOpenMatch={(matchId) => openMatch(matchId)}
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
      ) : view === "profileV2" ? (
        <ProfileV2
          user={user}
          matches={matches}
          courts={courts}
          onOpenWallet={() => setView("wallet")}
          onEditProfile={() => setView("editProfile")}
          onBack={() => setView("profile")}
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
        />
      ) : view === "wallet" ? (
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

          <div style={panelCard()}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Sessões</div>
            <div style={{ opacity: 0.75 }}>
              Em breve: ver dispositivos logados, encerrar sessões e 2FA.
            </div>
          </div>

          <div style={panelCard()}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Privacidade</div>
            <div style={{ opacity: 0.75 }}>
              Em breve: perfil público, ocultar email/telefone, bloqueios.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={goBack} style={panelBtn()}>
              ← Voltar
            </button>
            <button type="button" onClick={handleLogout} style={panelBtn("danger")}>
              Sair
            </button>
          </div>
        </div>
      ) : view === "arenaPanel" ? (
        <ArenaDashboard
          user={user}
          courts={courts.filter((c) => String(c?.arenaOwnerId || "") === String(user?.id || ""))}
          matches={matches}
          onBack={() => setView("profile")}
          onOpenAgenda={(court) => {
            setArenaSelectedCourtId(court?.id || null);
            setViewWithBack("arenaAgenda", "arenaPanel");
          }}
          onOpenFinance={() => setViewWithBack("arenaFinance", "arenaPanel")}
          onOpenPromotions={() => setViewWithBack("arenaPromotions", "arenaPanel")}
          onOpenAccountSettings={() => setViewWithBack("accountSettings", "arenaPanel")}
          onOpenCourtSettings={() => setViewWithBack("arenaCourtSettings", "arenaPanel")}
          onOpenTournaments={() => setViewWithBack("arenaTournaments", "arenaPanel")}
        />
      ) : view === "arenaAgenda" ? (
        <ArenaAgenda
          user={user}
          courts={courts.filter((c) => String(c?.arenaOwnerId || "") === String(user?.id || ""))}
          selectedCourtId={arenaSelectedCourtId}
          onBack={goBack}
          onOpenCourtSettings={() => setViewWithBack("arenaCourtSettings", "arenaAgenda")}
          onOpenFinance={() => setViewWithBack("arenaFinance", "arenaAgenda")}
          onOpenPromotions={() => setViewWithBack("arenaPromotions", "arenaAgenda")}
        />
      ) : view === "arenaFinance" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>💰 Financeiro da Arena</div>
          <div style={panelSub()}>
            Próximo: resumo de reservas, receita, comissão, mensalidade e relatórios.
          </div>

          <div style={panelCard()}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Resumo</div>
            <div style={{ opacity: 0.75 }}>
              Em breve: puxar do backend (reservas + pagamentos).
            </div>
          </div>

          <button type="button" onClick={goBack} style={panelBtn()}>
            ← Voltar
          </button>
        </div>
      ) : view === "arenaPromotions" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>🏷️ Promoções</div>
          <div style={panelSub()}>
            Próximo: cupons, pacotes, regras por quadra, descontos por horário.
          </div>

          <div style={panelCard()}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Cupons</div>
            <div style={{ opacity: 0.75 }}>
              Em breve: criar cupom, validade, limite por usuário e regras.
            </div>
          </div>

          <button type="button" onClick={goBack} style={panelBtn()}>
            ← Voltar
          </button>
        </div>
      ) : view === "arenaCourtSettings" ? (
        <ArenaCourtSettings
          user={user}
          courts={courts.filter((c) => String(c?.arenaOwnerId || "") === String(user?.id || ""))}
          onBack={goBack}
          onDone={() => {
            // depois do CRUD, recarrega do backend:
            const token = getToken();
            loadCourts(token);
            setView("arenaPanel");
          }}
        />
      ) : view === "arenaTournaments" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>🏆 Campeonatos</div>
          <div style={panelSub()}>
            Próximo: tabelas, inscrições, premiações e calendário.
          </div>

          <div style={panelCard()}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Modo rascunho</div>
            <div style={{ opacity: 0.75 }}>
              Deixa isso pronto pro primeiro cliente: “em desenvolvimento”.
            </div>
          </div>

          <button type="button" onClick={goBack} style={panelBtn()}>
            ← Voltar
          </button>
        </div>
      ) : view === "ownerDashboard" ? (
        <OwnerDashboard
          user={user}
          matches={matches}
          courts={courts}
          onBack={() => setView("profile")}
          onOpenFinance={() => setViewWithBack("ownerFinance", "ownerDashboard")}
          onOpenPromotions={() => setViewWithBack("ownerPromotions", "ownerDashboard")}
          onOpenAccountSettings={() => setViewWithBack("accountSettings", "ownerDashboard")}
          onOpenMatch={(matchId) => openMatch(matchId)}
        />
      ) : view === "ownerFinance" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>💰 Financeiro do Organizador</div>
          <div style={panelSub()}>
            Próximo: renda por partidas criadas, repasses e relatórios.
          </div>

          <div style={panelCard()}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Em breve</div>
            <div style={{ opacity: 0.75 }}>
              Depois a gente liga com backend (matches + pagamentos).
            </div>
          </div>

          <button type="button" onClick={goBack} style={panelBtn()}>
            ← Voltar
          </button>
        </div>
      ) : view === "ownerPromotions" ? (
        <div style={panelWrap()}>
          <div style={panelTitle()}>🏷️ Promoções do Organizador</div>
          <div style={panelSub()}>
            Próximo: cupons pra peladas, combos e parcerias com arenas.
          </div>

          <button type="button" onClick={goBack} style={panelBtn()}>
            ← Voltar
          </button>
        </div>
      ) : view === "matchCreator" ? (
        <MatchCreator
          courts={courts}
          organizerId={user?.id || null}
          onCreate={onCreateMatch}
          onBack={goBack}
          defaultType="fut7"
        />
      ) : view === "home" ? (
        <Home
          matches={matches}
          courts={courts}
          user={user}
          onSelectMatch={openMatch}
          onOpenRanking={() => setView("ranking")}
          onOpenMatchCreator={openMatchCreator}
          canCreateMatch={canCreateMatch}
          onOpenArena={openArenaPublic}
        />
      ) : (
        <div style={{ padding: 18, opacity: 0.75 }}>
          View não encontrada: <b>{view}</b>
        </div>
      )}

      {adminMatch ? (
        <MatchAdminModal
          isOpen={!!adminMatch}
          onClose={() => setAdminMatchId(null)}
          match={adminMatch}
          onSave={(playerStats, highlights, admin, discipline) => {
            onSaveMatchStats(adminMatch.id, playerStats, highlights, admin, discipline);
            setAdminMatchId(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}

// =========================================================
// ✅ Inline UI helpers (evita arquivo extra e evita erro)
// =========================================================
function panelWrap() {
  return {
    padding: 18,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    display: "grid",
    gap: 12,
    maxWidth: 820,
    margin: "0 auto",
  };
}

function panelTitle() {
  return {
    fontSize: 18,
    fontWeight: 1100,
    letterSpacing: 0.2,
  };
}

function panelSub() {
  return {
    opacity: 0.75,
    lineHeight: 1.4,
  };
}

function panelCard() {
  return {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    padding: 14,
  };
}

function panelBtn(variant = "default") {
  const base = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    fontWeight: 1000,
    cursor: "pointer",
    width: "fit-content",
  };

  if (variant === "danger") {
    return {
      ...base,
      border: "1px solid rgba(255,80,80,0.35)",
      background: "rgba(255,80,80,0.10)",
    };
  }

  return base;
}

