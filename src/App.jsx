import { useEffect, useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell.jsx";

import Home from "./views/Home/Home.jsx";
import MatchDetails from "./views/MatchDetails/MatchDetails.jsx";
import Profile from "./views/Profile/Profile.jsx";
import Wallet from "./views/Wallet/Wallet.jsx";
import MyMatches from "./views/MyMatches/MyMatches.jsx";
import Friends from "./views/Friends/Friends.jsx";
import Ranking from "./views/Ranking/Ranking.jsx";
import EditProfile from "./views/EditProfile/EditProfile.jsx";
import MatchCreator from "./views/MatchCreator/MatchCreator.jsx";

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
    pricePerPlayer: m?.pricePerPlayer ?? m?.price ?? 30,

    currentPlayers: Array.isArray(m?.players)
      ? m.players
      : Array.isArray(m?.currentPlayers)
      ? m.currentPlayers
      : [],
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
  // COURTS
  // =========================================================
  const [courts, setCourts] = useState([]);
  const [courtsLoading, setCourtsLoading] = useState(false);

  async function loadCourts(token) {
    setCourtsLoading(true);
    try {
      const data = await apiRequest("/courts", token ? { token } : undefined);

      const listRaw = Array.isArray(data)
        ? data
        : Array.isArray(data?.courts)
        ? data.courts
        : [];

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

      // ✅ se /matches estiver protegido no deploy, manda token
      const data = await apiRequest("/matches", token ? { token } : undefined);

      const list = Array.isArray(data) ? data.map(toUIFromApiMatch) : [];
      setMatches(list);
      console.log("✅ MATCHES carregadas:", list);
    } catch (e) {
      console.error("❌ GET /matches falhou:", e);
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  }

  // =========================================================
  // VIEW CONTROL
  // =========================================================
  const [view, setView] = useState("login");
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [adminMatchId, setAdminMatchId] = useState(null);
  const [arenaSelectedCourtId, setArenaSelectedCourtId] = useState(null);

  const isArenaOwner = user?.role === "arena_owner";
  const isOrganizer = user?.role === "owner" || user?.role === "admin";

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;

  const selectedCourt =
    selectedMatch?.court ||
    (selectedMatch?.courtId
      ? courts.find((c) => cleanText(c.id) === cleanText(selectedMatch.courtId))
      : null) ||
    null;

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

        setView(nextUser.role === "arena_owner" ? "arenaPanel" : "home");

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
  }, []);

  // =========================================================
  // AUTH HANDLERS
  // =========================================================
  async function handleLogin({ email, password }) {
    const data = await apiLogin({ email, password });
    setToken(data.token);

    const nextUser = { ...baseUser, ...data.user };
    setUser(nextUser);

    setView(nextUser.role === "arena_owner" ? "arenaPanel" : "home");
    await loadCourts(data.token);
    await loadMatches(data.token);
  }

  async function handleRegister({ name, email, password }) {
    const data = await apiRegister({ name, email, password });
    setToken(data.token);

    const nextUser = { ...baseUser, ...data.user };
    setUser(nextUser);

    setView(nextUser.role === "arena_owner" ? "arenaPanel" : "home");
    await loadCourts(data.token);
    await loadMatches(data.token);
  }

  function handleLogout() {
    clearToken();
    setUser(baseUser);
    setSelectedMatchId(null);
    setAdminMatchId(null);
    setArenaSelectedCourtId(null);
    setMatches([]);
    setCourts([]);
    setView("login");
  }

  function requireAuthOrLogin() {
    const token = getToken();
    if (!token) {
      setView("login");
      return null;
    }
    return token;
  }

  function openMatch(matchId) {
    const token = requireAuthOrLogin();
    if (!token) return;
    setSelectedMatchId(matchId);
    setView("matchDetails");
  }

  function openMatchCreator() {
    const token = requireAuthOrLogin();
    if (!token) return;
    setView("matchCreator");
  }

  function goBack() {
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

    if (view === "matchDetails") return setView("home");
    if (view === "editProfile") return setView("profile");
    if (view === "wallet") return setView("profile");
    if (view === "matchCreator") return setView("home");
    if (view === "register") return setView("login");

    return setView(isArenaOwner ? "arenaPanel" : "home");
  }

  function onNav(next) {
    const token = requireAuthOrLogin();
    if (!token) return;

    if (isArenaOwner) {
      if (next === "arenaPanel") return setView("arenaPanel");
      if (next === "arenaAgenda") return setView("arenaAgenda");
      if (next === "arenaFinance") return setView("arenaFinance");
      if (next === "profile") return setView("profile");
      return setView("arenaPanel");
    }

    if (next === "home") return setView("home");
    if (next === "matches") return setView("myMatches");
    if (next === "create") return setView("matchCreator");
    if (next === "profile") return setView("profile");
    if (next === "wallet") return setView("wallet");
    setView("home");
  }

  function onJoin(matchId, playerIds) {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const nextPlayers = Array.from(new Set([...(m.currentPlayers || []), ...(playerIds || [])]));
        return { ...m, currentPlayers: nextPlayers };
      })
    );
  }

  function onLeave(matchId) {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          currentPlayers: (m.currentPlayers || []).filter((pid) => pid !== user.id),
        };
      })
    );
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

    const isManual =
      !sentIdClean ||
      sentIdClean === "manual" ||
      sentIdClean === "__manual__" ||
      sentIdClean === "none" ||
      sentIdClean === "null";

    const dateISO = buildMatchISOFromPayload(payload);

    const matchAddress = cleanText(payload?.matchAddress || "");
    const typeUi = cleanText(payload?.type || payload?.courtType || payload?.matchType || "fut7").toLowerCase();
    const type = toApiMatchType(typeUi); // ✅ FIX DO 400: manda FUT7/FUTSAL

    const bodyBase = {
      title: cleanText(payload?.title || ""),
      date: dateISO,
      type, // ✅ backend enum
      maxPlayers: Number(payload?.maxPlayers ?? 14),
      pricePerPlayer: Number(payload?.pricePerPlayer ?? 30),
    };

    // ✅ MANUAL: não depende de arena (precisa backend aceitar courtId nullable)
    if (isManual) {
      if (!bodyBase.title) {
        alert("Informe o nome da partida.");
        return;
      }
      if (!matchAddress) {
        alert("Informe o local da partida (endereço).");
        return;
      }

      const body = {
        ...bodyBase,
        courtId: null,        // ✅ manual (backend precisa permitir)
        matchAddress,         // ✅ obrigatório no manual
      };

      console.log("[onCreateMatch][MANUAL] body:", body);

      const created = await apiRequest("/matches", {
        method: "POST",
        token,
        body,
      });

      await loadMatches(token);
      setSelectedMatchId(created?.id || null);
      setView("matchDetails");
      return;
    }

    // ✅ COM ARENA: valida courtId e manda sem \n
    const court =
      courts.find((c) => cleanText(c.id) === sentIdClean) ||
      courts.find((c) => cleanText(c.uiId) === sentIdClean) ||
      null;

    if (!court) {
      console.error("[onCreateMatch] courtId não encontrado:", {
        sentId,
        sentIdClean,
        courtsIds: courts.map((c) => c.id),
        courtsUiIds: courts.map((c) => c.uiId),
      });

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

    const body = {
      ...bodyBase,
      courtId: courtIdToSend,
      matchAddress: matchAddress || "", // opcional: override
    };

    console.log("[onCreateMatch][ARENA] body:", body);

    const created = await apiRequest("/matches", {
      method: "POST",
      token,
      body,
    });

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
    view === "ownerDashboard" ||
    view === "ownerFinance" ||
    view === "ownerPromotions" ||
    view === "accountSettings";

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
      : view === "ownerDashboard"
      ? "Painel do Organizador"
      : view === "ownerFinance"
      ? "Financeiro"
      : view === "ownerPromotions"
      ? "Promoções"
      : view === "accountSettings"
      ? "Configurações"
      : view === "home"
      ? "Bópô Fut"
      : view === "profile"
      ? "Perfil"
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
    : view === "matchDetails" || view === "editProfile"
    ? "home"
    : view === "ownerDashboard" ||
      view === "ownerFinance" ||
      view === "ownerPromotions" ||
      view === "accountSettings"
    ? "profile"
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
        <div style={{ padding: 18, opacity: 0.75 }}>
          Carregando {courtsLoading ? "arenas" : "partidas"}…
        </div>
      ) : view === "matchDetails" && selectedMatch ? (
        <MatchDetails
          match={selectedMatch}
          court={selectedCourt} // ✅ pode ser null no manual
          user={user}
          onJoin={onJoin}
          onLeave={onLeave}
          onBack={goBack}
          onManageStats={onManageStats}
          onNewMessage={onNewMessage}
        />
      ) : view === "profile" ? (
        <Profile
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

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={panelBtn()} onClick={() => setView("editProfile")}>
              ✎ Editar Perfil (atalho atual)
            </button>

            {isArenaOwner ? (
              <button type="button" style={panelBtn()} onClick={() => setView("arenaPanel")}>
                🏟️ Voltar ao Painel
              </button>
            ) : (
              <button type="button" style={panelBtn()} onClick={() => setView("ownerDashboard")}>
                🎯 Voltar ao Painel
              </button>
            )}
          </div>
        </div>
      ) : view === "matchCreator" ? (
        <MatchCreator
          courts={courts}
          organizerId={user.id}
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
        <div style={panelWrap()}>
          <div style={panelTitle()}>🏟️ Gerenciar Quadras</div>
          <div style={panelSub()}>
            Próximo: CRUD de quadras, preço/hora, esportes suportados, fotos e regras.
          </div>
        </div>
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
