// src/views/Profile/ProfileHybrid.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "./ProfileHybrid.module.css";

// ✅ UI oficial existente (mantém seu core)
import AchievementsGrid from "./components/AchievementsGrid.jsx";
import OwnerManagement from "./components/OwnerManagement.jsx";
import AchievementModal from "./components/modals/AchievementModal.jsx";
import MiniAchievementModal from "./components/modals/MiniAchievementModal.jsx";

// ✅ composer inteligente do feed
import FeedComposerLite from "./components/FeedComposerLite.jsx";

// ✅ lógica do backend (igual seu ProfileV2)
import { getMyProfile, getPublicProfile as getPublicProfileApi } from "../../services/profile/profileApi.js";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
} from "../../services/profile/friendsApi.js";
import { getFriendsPresence, heartbeat } from "../../services/profile/presenceApi.js";

// ✅ social-lite (bio, @username, tags, etc)
import {
  getPublicProfile as getSocialProfile,
  getSocialStats,
  upsertPublicProfile,
  syncSocialProfile,
} from "../../services/publicCourtsMock.js";

import EditPublicProfile from "../PublicCourts/EditPublicProfile.jsx";
import ProfileFriendsLite from "../PublicCourts/ProfileFriendsLite.jsx";

// ------------------------------------------------------------

function Pill({ children }) {
  return <span className={styles.pill}>{children}</span>;
}

function Tab({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.tabBtn} ${active ? styles.tabActive : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function safeCopy(text, ok = "Copiado ✅") {
  try {
    navigator.clipboard?.writeText(String(text || ""));
    alert(ok);
  } catch {
    alert("Não consegui copiar automaticamente 😬");
  }
}

function isSameId(a, b) {
  return String(a || "") === String(b || "");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * ✅ Overall mais "lógico" (sem depender do backend ter tudo)
 * - Se existirem stats extras (passes, faltas etc), ele usa.
 * - Se não existirem, fica 0 e segue.
 */
function calcOverall({
  games = 0,
  goals = 0,
  assists = 0,
  passes = 0,
  tackles = 0,
  saves = 0,
  fouls = 0,
  xp = 0,
  checkins = 0,
}) {
  const score =
    games * 2 +
    goals * 7 +
    assists * 5 +
    Math.floor(passes / 30) +
    Math.floor(tackles / 8) +
    Math.floor(saves / 6) -
    Math.floor(fouls / 6) +
    Math.floor(xp / 25) +
    Math.floor(checkins / 2);

  return clamp(10 + Math.floor(score / 6), 1, 99);
}

function calcAttributes({
  games = 0,
  goals = 0,
  assists = 0,
  passes = 0,
  tackles = 0,
  saves = 0,
  fouls = 0,
  xp = 0,
  checkins = 0,
}) {
  const overall = calcOverall({ games, goals, assists, passes, tackles, saves, fouls, xp, checkins });

  // ⚽ atributos "futebol"
  const pace = clamp(overall + Math.floor(checkins / 2), 10, 99);
  const shooting = clamp(overall + goals * 2, 10, 99);
  const passing = clamp(overall + assists * 2 + Math.floor(passes / 20), 10, 99);
  const defending = clamp(overall + Math.floor(tackles / 2), 10, 99);
  const gk = clamp(overall + Math.floor(saves / 2), 10, 99);

  // disciplina: faltas pesam pra baixo, mas nunca zera
  const discipline = clamp(90 - Math.floor(fouls * 1.5), 10, 99);

  return { overall, pace, shooting, passing, defending, gk, discipline };
}

function timeAgo(ts) {
  let t = ts;
  if (typeof ts === "string") {
    const parsed = Date.parse(ts);
    t = Number.isFinite(parsed) ? parsed : Date.now();
  }
  t = Number(t) || Date.now();

  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function seedFeed(user) {
  const seed = [
    {
      id: `seed_${Date.now()}_1`,
      type: "MOMENT",
      moment: { kind: "RESENHA", text: "Treino pago. Hoje é dia de evolução 💪⚽" },
      userName: user?.name || "Jogador",
      userAvatar: user?.avatar || "https://picsum.photos/seed/bopo_avatar/120",
      caption: "Treino pago. Hoje é dia de evolução 💪⚽",
      image: "https://picsum.photos/seed/bopo_feed_1/1100/620",
      createdAt: Date.now() - 1000 * 60 * 45,
      likes: 3,
    },
    {
      id: `seed_${Date.now()}_2`,
      type: "GAME",
      game: { home: "Time A", away: "Time B", scoreHome: 3, scoreAway: 2, place: "Quadra", when: new Date().toISOString() },
      userName: user?.name || "Jogador",
      userAvatar: user?.avatar || "https://picsum.photos/seed/bopo_avatar/120",
      caption: "Jogo pegado! 3x2 e muita resenha 😄",
      image: "https://picsum.photos/seed/bopo_feed_2/1100/620",
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
      likes: 8,
    },
  ];
  return seed;
}

function postBadge(p) {
  const t = p?.type;
  if (t === "GAME") return "📸 Jogo";
  if (t === "MOMENT") return "⭐ Momento";
  if (t === "CHECKIN") return "📍 Check-in";
  if (t === "CALL") return "📣 Vaga";
  return "📰 Post";
}

function postSummary(p) {
  if (p?.type === "GAME" && p.game) {
    const a = p.game.home || "Time A";
    const b = p.game.away || "Time B";
    const sh = p.game.scoreHome ?? "";
    const sa = p.game.scoreAway ?? "";
    const scoreTxt = sh !== "" || sa !== "" ? `${sh || 0}x${sa || 0}` : "";
    const place = p.game.place ? ` • ${p.game.place}` : "";
    return `${a} ${scoreTxt} ${b}${place}`.trim();
  }

  if (p?.type === "MOMENT" && p.moment) {
    const k = p.moment.kind === "GOL" ? "⚽ Gol" : p.moment.kind === "DEFESA" ? "🧤 Defesa" : "😄 Resenha";
    return p.moment.text ? `${k} — ${p.moment.text}` : k;
  }

  if (p?.type === "CHECKIN" && p.checkin) {
    const k = p.checkin.kind === "PRACA" ? "🌳 Praça" : "🏟️ Quadra";
    const place = p.checkin.place ? ` ${p.checkin.place}` : "";
    const city = p.checkin.city ? ` • ${p.checkin.city}` : "";
    return `${k}${place}${city}`.trim();
  }

  if (p?.type === "CALL" && p.call) {
    const place = p.call.place ? `${p.call.place}` : "Local";
    const vagas = Number.isFinite(p.call.vagas) ? ` • ${p.call.vagas} vaga(s)` : "";
    return `📣 Tem vaga hoje? • ${place}${vagas}`.trim();
  }

  return "";
}

export default function ProfileHybrid({
  user,
  matches,
  courts,
  onOpenWallet,
  onEditProfile,
  onBack,
  onLogout,

  onOpenOrganizerPanel,
  onOpenArenaPanel,
  onOpenAgenda,
  onOpenFinance,
  onOpenPromotions,
  onOpenAccountSettings,

  viewedUserId,
  onStartChallenge,
  onStartChat,
}) {
  const isPublic = !!viewedUserId && !isSameId(viewedUserId, user?.id);
  const targetUserId = isPublic ? viewedUserId : user?.id;

  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [tabsOpen, setTabsOpen] = useState(true);

  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [miniGadgetAchievement, setMiniGadgetAchievement] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [socialProfile, setSocialProfileState] = useState(null);
  const [socialStats, setSocialStatsState] = useState(null);

  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [presenceMap, setPresenceMap] = useState({});

  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  // feed (mock/local)
  const FEED_KEY = useMemo(() => `bopo_feed_v1_${targetUserId || "anon"}`, [targetUserId]);
  const [feed, setFeed] = useState([]);

  const isOrganizer = (profile?.role || user?.role) === "owner";
  const isArenaOwner = (profile?.role || user?.role) === "arena_owner";

  async function refreshOfficial() {
    if (!targetUserId) return;

    if (!isPublic && !user?.id) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError("Faça login para carregar o perfil.");
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const data = isPublic ? await getPublicProfileApi(targetUserId) : await getMyProfile();
      setProfile(data || null);
    } catch (err) {
      if (err?.status === 404) {
        setProfile(null);
        setProfileError("");
      } else {
        setProfile(null);
        const msg =
          err?.message?.includes("401") || err?.message?.toLowerCase?.().includes("unauthorized")
            ? "Sua sessão expirou. Faça login novamente."
            : err?.message || "Erro ao carregar perfil 😬";
        setProfileError(msg);
      }
    } finally {
      setProfileLoading(false);
    }
  }

  function refreshSocial() {
    if (!targetUserId) return;
    try {
      setSocialProfileState(getSocialProfile(targetUserId));
      setSocialStatsState(getSocialStats(targetUserId));
    } catch {
      setSocialProfileState(null);
      setSocialStatsState(null);
    }
  }

  async function refreshFriends() {
    if (!user?.id) return;
    setFriendsLoading(true);
    setFriendsError("");

    try {
      const [f, inc, out] = await Promise.all([listFriends(), listIncomingRequests(), listOutgoingRequests()]);
      setFriends(Array.isArray(f) ? f : []);
      setIncoming(Array.isArray(inc) ? inc : []);
      setOutgoing(Array.isArray(out) ? out : []);
    } catch (err) {
      setFriendsError(err?.message || "Erro ao carregar amigos 😬");
    } finally {
      setFriendsLoading(false);
    }
  }

  async function refreshPresence() {
    if (!user?.id) return;
    try {
      const map = await getFriendsPresence();
      setPresenceMap(map || {});
    } catch {}
  }

  function loadFeed() {
    try {
      const raw = localStorage.getItem(FEED_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) {
        setFeed(parsed);
      } else {
        const seeded = seedFeed({ name: user?.name, avatar: user?.avatar });
        setFeed(seeded);
        localStorage.setItem(FEED_KEY, JSON.stringify(seeded));
      }
    } catch {
      const seeded = seedFeed({ name: user?.name, avatar: user?.avatar });
      setFeed(seeded);
    }
  }

  function persistFeed(next) {
    setFeed(next);
    try {
      localStorage.setItem(FEED_KEY, JSON.stringify(next));
    } catch {}
  }

  function likePost(id) {
    const next = (Array.isArray(feed) ? feed : []).map((p) =>
      p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p
    );
    persistFeed(next);
  }

  useEffect(() => {
    refreshOfficial();
    refreshSocial();
    setTab("overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [FEED_KEY]);

  useEffect(() => {
    if (!user?.id) return;

    refreshFriends();
    refreshPresence();

    heartbeat?.().catch(() => {});
    const t = setInterval(() => {
      heartbeat?.().catch(() => {});
      refreshPresence();
    }, 20000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const merged = useMemo(() => {
    const s = socialProfile || {};
    const p = profile || {};

    const baseName = p?.name || user?.name || s?.name || "Jogador";
    const avatar = s?.avatar || p?.avatar || user?.avatar || "https://picsum.photos/seed/user/240";

    // ✅ stats oficiais + opcionais (se existirem)
    const coreStats = p?.stats || user?.stats || { goals: 0, assists: 0, gamesPlayed: 0 };

    return {
      id: targetUserId,
      name: baseName,
      role: p?.role || user?.role || "user",
      email: p?.email || user?.email || "",
      avatar,

      username: s?.username || "",
      city: s?.city || "Curitiba",
      bairro: s?.bairro || "",
      position: s?.position || user?.position || "Meia",
      level: s?.level || user?.level || "Médio",
      foot: s?.foot || "Destro",
      bio: s?.bio || "",
      tags: Array.isArray(s?.tags) ? s.tags : [],

      // ✅ aqui já deixamos espaço pra futuramente vir do backend sem quebrar UI
      stats: {
        gamesPlayed: coreStats?.gamesPlayed || 0,
        goals: coreStats?.goals || 0,
        assists: coreStats?.assists || 0,
        passes: coreStats?.passes || 0,
        fouls: coreStats?.fouls || 0,
        tackles: coreStats?.tackles || 0,
        saves: coreStats?.saves || 0,
      },

      unlockedAchievementIds: p?.unlockedAchievementIds || user?.unlockedAchievementIds || [],
      walletBalance: p?.walletBalance ?? user?.walletBalance ?? 0,
    };
  }, [profile, socialProfile, targetUserId, user]);

  const socialLevel = socialStats?.level || 1;
  const socialXp = socialStats?.xp || 0;
  const totalCheckins = socialStats?.totalCheckins || 0;

  const attr = useMemo(() => {
    return calcAttributes({
      games: merged.stats?.gamesPlayed || 0,
      goals: merged.stats?.goals || 0,
      assists: merged.stats?.assists || 0,
      passes: merged.stats?.passes || 0,
      fouls: merged.stats?.fouls || 0,
      tackles: merged.stats?.tackles || 0,
      saves: merged.stats?.saves || 0,
      xp: socialXp,
      checkins: totalCheckins,
    });
  }, [merged.stats, socialXp, totalCheckins]);

  const iAmLogged = !!user?.id;
  const iAmViewingSomeone = isPublic;

  const alreadyFriend = useMemo(() => {
    if (!iAmLogged || !iAmViewingSomeone) return false;
    return friends.some((f) => isSameId(f?.id, targetUserId));
  }, [friends, iAmLogged, iAmViewingSomeone, targetUserId]);

  const outgoingPending = useMemo(() => {
    if (!iAmLogged || !iAmViewingSomeone) return false;
    return outgoing.some((r) => isSameId(r?.toUserId, targetUserId) || isSameId(r?.toId, targetUserId));
  }, [outgoing, iAmLogged, iAmViewingSomeone, targetUserId]);

  async function handleAddFriend() {
    if (!iAmLogged) return alert("Faça login para adicionar amigos.");
    if (!iAmViewingSomeone) return;
    if (alreadyFriend) return alert("Vocês já são amigos 🤝");
    if (outgoingPending) return alert("Pedido já enviado 📩");

    setActionBusy(true);
    try {
      await sendFriendRequest(targetUserId);
      await refreshFriends();
      alert("Pedido enviado ✅");
    } catch (err) {
      alert(err?.message || "Erro ao enviar pedido 😬");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleAccept(fromUserId) {
    setActionBusy(true);
    try {
      await acceptFriendRequest(fromUserId);
      await refreshFriends();
    } catch (err) {
      alert(err?.message || "Erro ao aceitar 😬");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDecline(fromUserId) {
    setActionBusy(true);
    try {
      await declineFriendRequest(fromUserId);
      await refreshFriends();
    } catch (err) {
      alert(err?.message || "Erro ao recusar 😬");
    } finally {
      setActionBusy(false);
    }
  }

  function handleSaveSocial(patch) {
    if (!user?.id) return;

    try {
      const updated = upsertPublicProfile(user.id, patch);
      syncSocialProfile(user.id, updated);
      setEditOpen(false);
      refreshSocial();
      alert("Perfil atualizado ✅");
    } catch (err) {
      alert(err?.message || "Erro ao salvar perfil 😬");
    }
  }

  const shareText = merged.username ? `@${merged.username}` : `ID: ${targetUserId}`;

  // ✅ mini stats do topo (perfil real)
  const topStats = [
    { k: "⚽", v: merged.stats?.gamesPlayed || 0, l: "Jogos" },
    { k: "🥅", v: merged.stats?.goals || 0, l: "Gols" },
    { k: "🎁", v: merged.stats?.assists || 0, l: "Assist." },
    { k: "🎯", v: merged.stats?.passes || 0, l: "Passes" },
    { k: "🟨", v: merged.stats?.fouls || 0, l: "Faltas" },
  ];

  return (
    <div className={styles.page}>
      {/* =====================================================
          PERFIL (cara de perfil real)
      ====================================================== */}
      <div className={styles.headerCard}>
        {/* topo: banner + avatar */}
        <div className={styles.profileTop}>
          <div className={styles.profileBanner} />
          <div className={styles.profileAvatarWrap}>
            <img src={merged.avatar} alt="" className={styles.profileAvatar} />
          </div>
        </div>

        {/* identidade */}
        <div className={styles.profileIdentity}>
          <div className={styles.profileNameRow}>
            <div className={styles.profileName}>{merged.name}</div>

            {merged.role === "admin" ? <Pill>⚙️ Admin</Pill> : null}
            {merged.role === "arena_owner" ? <Pill>🏟️ Arena</Pill> : null}
            {merged.role === "owner" ? <Pill>🧠 Organizador</Pill> : null}
          </div>

          <div className={styles.profileSubRow}>
            {merged.username ? <Pill>@{merged.username}</Pill> : <Pill>Sem @</Pill>}
            <Pill>{merged.position}</Pill>
            <Pill>{merged.level}</Pill>
            <Pill>{merged.foot}</Pill>
          </div>

          <div className={styles.profileLocation}>
            📍 {merged.bairro ? `${merged.bairro} • ` : ""}
            {merged.city}
          </div>

          {/* bio */}
          {merged.bio ? (
            <div className={styles.profileBio}>{merged.bio}</div>
          ) : (
            <div className={styles.profileBioMuted}>
              {iAmViewingSomeone ? "Sem bio por enquanto." : "Sem bio ainda — clica no menu (⋯) e edita seu perfil 😉"}
            </div>
          )}

          {/* tags */}
          {merged.tags?.length ? (
            <div className={styles.tagsRow}>
              {merged.tags.map((t) => (
                <span key={t} className={styles.tag}>
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {/* stats rápidos (perfil real) */}
          <div className={styles.profileQuickStats}>
            {topStats.map((s) => (
              <div key={s.l} className={styles.quickStat}>
                <div className={styles.quickStatTop}>
                  <span className={styles.quickStatIcon}>{s.k}</span>
                  <span className={styles.quickStatVal}>{s.v}</span>
                </div>
                <div className={styles.quickStatLabel}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* meta pills (OVR + Lv + XP + checkins) */}
          <div className={styles.profileMetaPills}>
            <Pill>⭐ OVR {attr.overall}</Pill>
            <Pill>🔥 Lv {socialLevel}</Pill>
            <Pill>⚡ {socialXp} XP</Pill>
            <Pill>📍 {totalCheckins} check-ins</Pill>
          </div>

          {/* ações (quando visualiza outro) */}
          {iAmViewingSomeone ? (
            <div className={styles.profileActions}>
              {alreadyFriend ? (
                <div className={styles.friendOk}>🤝 Amigos</div>
              ) : (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleAddFriend}
                  disabled={actionBusy || outgoingPending}
                  title={outgoingPending ? "Pedido já enviado" : "Enviar pedido"}
                >
                  {outgoingPending ? "📩 Pedido enviado" : "➕ Adicionar amigo"}
                </button>
              )}

              <button
                type="button"
                className={styles.ghostBtnWide}
                onClick={() => onStartChallenge?.({ id: targetUserId, name: merged.name, avatar: merged.avatar })}
              >
                ⚔️ Desafiar
              </button>

              <button
                type="button"
                className={styles.ghostBtnWide}
                onClick={() => onStartChat?.({ id: targetUserId, name: merged.name, avatar: merged.avatar })}
              >
                💬 Conversar
              </button>
            </div>
          ) : null}
        </div>

        {/* =====================================================
            Tabs
        ====================================================== */}
        <div className={styles.tabsWrap}>
          <div className={styles.tabsHeader}>
            <div className={styles.tabsHeaderTitle}>Seções</div>
            <button
              type="button"
              className={styles.chevBtn}
              onClick={() => setTabsOpen((v) => !v)}
              aria-label={tabsOpen ? "Ocultar seções" : "Mostrar seções"}
              title={tabsOpen ? "Ocultar" : "Mostrar"}
            >
              {tabsOpen ? "▾" : "▸"}
            </button>
          </div>

          {tabsOpen ? (
            <div className={styles.tabsRow}>
              <Tab active={tab === "overview"} onClick={() => setTab("overview")}>
                📰 Feed
              </Tab>
              <Tab active={tab === "social"} onClick={() => setTab("social")}>
                🌐 Social
              </Tab>

              {!iAmViewingSomeone ? (
                <Tab active={tab === "friends"} onClick={() => setTab("friends")}>
                  👥 Amigos
                </Tab>
              ) : null}

              <Tab active={tab === "official"} onClick={() => setTab("official")}>
                🏆 Oficial
              </Tab>
              <Tab active={tab === "achievements"} onClick={() => setTab("achievements")}>
                🏅 Conquistas
              </Tab>

              {!iAmViewingSomeone && (isOrganizer || isArenaOwner) ? (
                <Tab active={tab === "management"} onClick={() => setTab("management")}>
                  🧠 Gestão
                </Tab>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* =====================================================
          CONTEÚDO (1 COLUNA — sem card do lado)
      ====================================================== */}
      <div className={styles.content}>
        {profileLoading ? (
          <div className={styles.softCard}>
            <div className={styles.softTitle}>Carregando perfil…</div>
            <div className={styles.softHint}>Buscando dados oficiais do backend.</div>
          </div>
        ) : profileError ? (
          <div className={styles.softCard}>
            <div className={styles.softTitle}>Não consegui carregar o perfil 😬</div>
            <div className={styles.softHint}>{profileError}</div>
            <button type="button" className={styles.primaryBtn} onClick={refreshOfficial}>
              Tentar de novo
            </button>
          </div>
        ) : null}

        {/* =========================
            FEED
        ========================= */}
        {tab === "overview" ? (
          <div className={styles.block}>
            <div className={styles.feedTop}>
              <div className={styles.blockTitle}>📰 Feed</div>
              {iAmViewingSomeone ? <Pill>somente leitura</Pill> : null}
            </div>

            {!iAmViewingSomeone ? (
              <FeedComposerLite
                userId={targetUserId}
                userName={merged.name}
                userAvatar={merged.avatar}
                defaultCity={merged.city || "Curitiba"}
                onCreate={(post) => {
                  const next = [post, ...(Array.isArray(feed) ? feed : [])].slice(0, 50);
                  persistFeed(next);
                }}
              />
            ) : null}

            <div className={styles.feedList}>
              {(Array.isArray(feed) ? feed : []).map((p) => (
                <div key={p.id} className={styles.post}>
                  <div className={styles.postHeader}>
                    <div className={styles.postUser}>
                      <img src={p.userAvatar} alt="" className={styles.postAvatar} />
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.postName}>{p.userName}</div>
                        <div className={styles.postTime}>{timeAgo(p.createdAt)}</div>
                      </div>
                    </div>

                    <div className={styles.postBadges}>
                      <span className={styles.postBadge}>{postBadge(p)}</span>
                      <Pill>⭐ +{p.likes || 0}</Pill>
                    </div>
                  </div>

                  {postSummary(p) ? <div className={styles.postMeta}>{postSummary(p)}</div> : null}
                  {p.image ? <img src={p.image} alt="" className={styles.postImg} /> : null}
                  {p.caption ? <div className={styles.postCaption}>{p.caption}</div> : null}

                  <div className={styles.postActions}>
                    <button type="button" className={styles.ghostBtnWide} onClick={() => likePost(p.id)}>
                      👍 Curtir
                    </button>

                    {!iAmViewingSomeone ? (
                      <button
                        type="button"
                        className={styles.ghostBtnWide}
                        onClick={() => safeCopy(p.caption || "", "Legenda copiada ✅")}
                      >
                        📋 Copiar legenda
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* =========================
            SOCIAL (1 coluna)
        ========================= */}
        {tab === "social" ? (
          <div className={styles.block}>
            <div className={styles.blockTitle}>🌐 Social</div>

            <div className={styles.softCard}>
              <div className={styles.softTitle}>Status / presença / check-ins</div>
              <div className={styles.softHint}>Aqui entra presença em praças, últimos check-ins e desafios.</div>

              <div className={styles.pillsRow} style={{ marginTop: 10 }}>
                <Pill>🔥 Lv {socialLevel}</Pill>
                <Pill>⚡ {socialXp} XP</Pill>
                <Pill>📍 {totalCheckins} check-ins</Pill>
              </div>

              <div className={styles.actionRow} style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className={styles.ghostBtnWide}
                  onClick={() => safeCopy(targetUserId, "ID copiado ✅")}
                >
                  🆔 Copiar ID
                </button>
                <button type="button" className={styles.ghostBtnWide} onClick={() => safeCopy(shareText, "Copiado ✅")}>
                  📤 Copiar @/ID
                </button>
              </div>

              {!iAmViewingSomeone ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  style={{ marginTop: 10 }}
                  onClick={() => setEditOpen(true)}
                >
                  ✏️ Editar perfil público
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* =========================
            FRIENDS (1 coluna)
        ========================= */}
        {tab === "friends" && !iAmViewingSomeone ? (
          <div className={styles.block}>
            <div className={styles.blockTitle}>👥 Amigos</div>

            {friendsLoading ? (
              <div className={styles.softCard}>
                <div className={styles.softTitle}>Carregando amigos…</div>
                <div className={styles.softHint}>Buscando lista e pedidos.</div>
              </div>
            ) : friendsError ? (
              <div className={styles.softCard}>
                <div className={styles.softTitle}>Erro ao carregar amigos 😬</div>
                <div className={styles.softHint}>{friendsError}</div>
                <button type="button" className={styles.primaryBtn} onClick={refreshFriends}>
                  Tentar de novo
                </button>
              </div>
            ) : (
              <>
                <div className={styles.softCard}>
                  <div className={styles.softTitle}>📩 Pedidos recebidos</div>
                  {incoming.length === 0 ? (
                    <div className={styles.softHint}>Sem pedidos por enquanto.</div>
                  ) : (
                    <div className={styles.list}>
                      {incoming.map((r) => (
                        <div key={r.id || r.fromUserId} className={styles.row}>
                          <div className={styles.rowLeft}>
                            <div className={styles.rowName}>{r.fromUser?.name || "Usuário"}</div>
                            <div className={styles.rowSub}>Quer te adicionar</div>
                          </div>

                          <div className={styles.rowRight}>
                            <button
                              type="button"
                              className={styles.primaryBtn}
                              disabled={actionBusy}
                              onClick={() => handleAccept(r.fromUserId)}
                            >
                              Aceitar
                            </button>
                            <button
                              type="button"
                              className={styles.ghostBtnWide}
                              disabled={actionBusy}
                              onClick={() => handleDecline(r.fromUserId)}
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.softCard}>
                  <div className={styles.softTitle}>🤝 Amigos ({friends.length})</div>
                  {friends.length === 0 ? (
                    <div className={styles.softHint}>Você ainda não tem amigos.</div>
                  ) : (
                    <div className={styles.list}>
                      {friends.map((f) => {
                        const pr = presenceMap?.[f.id] || {};
                        const status = pr.status || "OFFLINE";
                        return (
                          <div key={f.id} className={styles.row}>
                            <div className={styles.rowLeft}>
                              <div className={styles.rowName}>{f.name}</div>
                              <div className={styles.rowSub}>
                                {status === "ONLINE" ? "🟢 Online" : status === "IN_MATCH" ? "🟡 Em jogo" : "⚪ Offline"}
                              </div>
                            </div>

                            <div className={styles.rowRight}>
                              <button
                                type="button"
                                className={styles.ghostBtnWide}
                                onClick={() => onStartChat?.({ id: f.id, name: f.name, avatar: f.avatar })}
                              >
                                💬 Chat
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.softCard}>
                  <div className={styles.softTitle}>🌐 Amigos (Lite)</div>
                  <ProfileFriendsLite user={user} />
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* =========================
            OFICIAL (1 coluna)
        ========================= */}
        {tab === "official" ? (
          <div className={styles.block}>
            <div className={styles.blockTitle}>🏆 Oficial</div>

            <div className={styles.softCard}>
              <div className={styles.softTitle}>Números do jogador</div>
              <div className={styles.softHint}>
                Quando teu backend estiver completo, esses números vêm validados. Por enquanto: 0 quando não existir.
              </div>

              <div className={styles.profileQuickStats} style={{ marginTop: 12 }}>
                {topStats.map((s) => (
                  <div key={s.l} className={styles.quickStat}>
                    <div className={styles.quickStatTop}>
                      <span className={styles.quickStatIcon}>{s.k}</span>
                      <span className={styles.quickStatVal}>{s.v}</span>
                    </div>
                    <div className={styles.quickStatLabel}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {!iAmViewingSomeone ? (
              <div className={styles.actionRow}>
                <button type="button" className={styles.ghostBtnWide} onClick={onOpenAccountSettings}>
                  ⚙️ Conta
                </button>

                {isOrganizer ? (
                  <button type="button" className={styles.ghostBtnWide} onClick={onOpenOrganizerPanel}>
                    🧠 Painel Organizador
                  </button>
                ) : null}

                {isArenaOwner ? (
                  <>
                    <button type="button" className={styles.ghostBtnWide} onClick={onOpenArenaPanel}>
                      🏟️ Painel Arena
                    </button>
                    <button type="button" className={styles.ghostBtnWide} onClick={onOpenAgenda}>
                      🗓️ Agenda
                    </button>
                    <button type="button" className={styles.ghostBtnWide} onClick={onOpenFinance}>
                      💰 Financeiro
                    </button>
                    <button type="button" className={styles.ghostBtnWide} onClick={onOpenPromotions}>
                      🎟️ Promoções
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* =========================
            CONQUISTAS
        ========================= */}
        {tab === "achievements" ? (
          <div className={styles.block}>
            <div className={styles.blockTitle}>🏅 Conquistas</div>
            <AchievementsGrid
              user={merged}
              onOpenAchievement={(a) => setSelectedAchievement(a)}
              onMiniGadget={(a) => setMiniGadgetAchievement(a)}
            />
          </div>
        ) : null}

        {/* =========================
            GESTÃO
        ========================= */}
        {tab === "management" && !iAmViewingSomeone ? (
          <div className={styles.block}>
            <div className={styles.blockTitle}>🧠 Gestão</div>
            <OwnerManagement
              user={merged}
              onOpenOrganizerPanel={onOpenOrganizerPanel}
              onOpenArenaPanel={onOpenArenaPanel}
              onOpenAgenda={onOpenAgenda}
              onOpenFinance={onOpenFinance}
              onOpenPromotions={onOpenPromotions}
            />
          </div>
        ) : null}
      </div>

      {!iAmViewingSomeone ? (
        <EditPublicProfile open={editOpen} initial={merged} onClose={() => setEditOpen(false)} onSave={handleSaveSocial} />
      ) : null}

      {selectedAchievement ? (
        <AchievementModal achievement={selectedAchievement} onClose={() => setSelectedAchievement(null)} />
      ) : null}

      {miniGadgetAchievement ? (
        <MiniAchievementModal achievement={miniGadgetAchievement} onClose={() => setMiniGadgetAchievement(null)} />
      ) : null}
    </div>
  );
}
