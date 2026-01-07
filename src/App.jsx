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

import { mockUsers } from "./mockData.js";

// ✅ Modal Admin da Pelada
import MatchAdminModal from "./views/MatchAdmin/modals/MatchAdminModal.jsx";

export default function App() {
  // =========================================================
  // USER BASE (serve como fallback enquanto carrega /me)
  // =========================================================
  const baseUser = useMemo(
    () => ({
      id: null,
      name: "",
      role: "user", // ✅ corrigido (no backend é user|owner|admin)
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

  // ✅ USERS (fallback/mock por enquanto — backend-ready)
  // Depois você troca isso por um fetch real (GET /users)
  const users = useMemo(() => mockUsers, []);

  // =========================================================
  // MOCKS TEMPORÁRIOS (até criarmos endpoints)
  // =========================================================
  const courts = useMemo(
    () => [
      {
        id: "c1",
        name: "Arena Curitiba",
        address: "Curitiba - PR",
        imageUrl:
          "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&q=80&w=1200&h=700",
        googleMapsUrl: "",
        type: "FUT7",
      },
      {
        id: "c2",
        name: "Quadra do Bairro",
        address: "Bairro X - Curitiba - PR",
        imageUrl:
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200&h=700",
        googleMapsUrl: "",
        type: "FUTSAL",
      },
    ],
    []
  );

  const [matches, setMatches] = useState(() => [
    {
      id: "m1",
      type: "fut7",
      date: "Hoje",
      time: "20:00",
      courtId: "c1",
      organizerId: "u1",
      pricePerPlayer: 15,
      maxPlayers: 14,
      currentPlayers: ["u1", "u2", "u3", "u4", "u5", "u6"],
      distance: 3.2,
      messages: [
        {
          id: "msg-1",
          senderId: "u2",
          senderName: "Carlos",
          text: "Boraaa, hoje eu tô on 🔥",
          timestamp: "18:20",
        },
      ],
    },
  ]);

  // =========================================================
  // VIEW CONTROL
  // =========================================================
  const [view, setView] = useState("login");
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ Admin Modal
  const [adminMatchId, setAdminMatchId] = useState(null);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;
  const selectedCourt = selectedMatch
    ? courts.find((c) => c.id === selectedMatch.courtId) || null
    : null;

  // =========================================================
  // AUTH BOOT — se tiver token, busca /me
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
        setUser((prev) => ({ ...prev, ...data.user }));
        setView("home");
      } catch {
        clearToken();
        setView("login");
      } finally {
        setAuthLoading(false);
      }
    }
    boot();
  }, []);

  // =========================================================
  // AUTH HANDLERS
  // =========================================================
  async function handleLogin({ email, password }) {
    const data = await apiLogin({ email, password });
    setToken(data.token);
    setUser((prev) => ({ ...prev, ...data.user }));
    setView("home");
  }

  async function handleRegister({ name, email, password, role }) {
    const data = await apiRegister({ name, email, password, role });
    setToken(data.token);
    setUser((prev) => ({ ...prev, ...data.user }));
    setView("home");
  }

  function handleLogout() {
    clearToken();
    setUser(baseUser);
    setSelectedMatchId(null);
    setAdminMatchId(null);
    setView("login");
  }

  // =========================================================
  // NAV & FLOW
  // =========================================================
  function openMatch(matchId) {
    setSelectedMatchId(matchId);
    setView("matchDetails");
  }

  function openMatchCreator() {
    setView("matchCreator");
  }

  function goBack() {
    if (view === "matchDetails") return setView("home");
    if (view === "editProfile") return setView("profile");
    if (view === "wallet") return setView("profile");
    if (view === "matchCreator") return setView("home");
    if (view === "register") return setView("login");
    return setView("home");
  }

  function onNav(next) {
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
        const nextPlayers = Array.from(
          new Set([...(m.currentPlayers || []), ...(playerIds || [])])
        );
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
          currentPlayers: (m.currentPlayers || []).filter(
            (pid) => pid !== user.id
          ),
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

  function onCreateMatch(newMatch) {
    setMatches((prev) => [newMatch, ...prev]);
    setSelectedMatchId(newMatch.id);
    setView("matchDetails");
  }

  const canCreateMatch = user?.role === "owner" || user?.role === "admin";

  const showBack =
    view === "matchDetails" ||
    view === "editProfile" ||
    view === "matchCreator" ||
    view === "register";

  const title =
    view === "login"
      ? "Entrar"
      : view === "register"
      ? "Criar conta"
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

  const bottomActive =
    view === "matchCreator"
      ? "create"
      : view === "matchDetails" || view === "editProfile"
      ? "home"
      : view;

  const isAuthView = view === "login" || view === "register";

  const adminMatch = adminMatchId
    ? matches.find((m) => m.id === adminMatchId) || null
    : null;

  return (
    <AppShell
      title={title}
      showBack={showBack}
      onBack={goBack}
      active={isAuthView ? "home" : bottomActive}
      onNav={onNav}
      canCreateMatch={!isAuthView && canCreateMatch}
    >
      {authLoading ? (
        <div style={{ padding: 18, opacity: 0.75 }}>Carregando...</div>
      ) : view === "login" ? (
        <Login
          onLoginSuccess={handleLogin}
          onGoRegister={() => setView("register")}
        />
      ) : view === "register" ? (
        <Register
          onRegisterSuccess={handleRegister}
          onGoLogin={() => setView("login")}
        />
      ) : view === "matchDetails" && selectedMatch && selectedCourt ? (
        <MatchDetails
          match={selectedMatch}
          court={selectedCourt}
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
          onBack={() => setView("home")}
          onLogout={handleLogout}
        />
      ) : view === "wallet" ? (
        <Wallet user={user} onBack={() => setView("profile")} />
      ) : view === "myMatches" ? (
        <MyMatches
          matches={matches}
          courts={courts}
          user={user}
          onSelectMatch={openMatch}
        />
      ) : view === "friends" ? (
        <Friends onBack={() => setView("profile")} />
      ) : view === "ranking" ? (
        <Ranking
          users={users}
          matches={matches}
          onBack={() => setView("home")}
        />
      ) : view === "editProfile" ? (
        <EditProfile
          user={user}
          onSave={onSaveProfile}
          onBack={() => setView("profile")}
        />
      ) : view === "matchCreator" ? (
        <MatchCreator
          courts={courts}
          organizerId={user.id}
          onCreate={onCreateMatch}
          onBack={() => setView("home")}
        />
      ) : (
        <Home
          matches={matches}
          courts={courts}
          user={user}
          canCreateMatch={canCreateMatch}
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
            onSaveMatchStats(
              adminMatch.id,
              playerStats,
              highlights,
              admin,
              discipline
            );
            setAdminMatchId(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}
