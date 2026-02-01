// src/views/Profile/ProfileHybrid.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "./ProfileHybrid.module.css";

// ✅ UI oficial existente (mantém seu core)
import WalletCard from "./components/WalletCard.jsx";
import AchievementsGrid from "./components/AchievementsGrid.jsx";
import OwnerManagement from "./components/OwnerManagement.jsx";
import AchievementModal from "./components/modals/AchievementModal.jsx";
import MiniAchievementModal from "./components/modals/MiniAchievementModal.jsx";

// ✅ NOVO: composer inteligente do feed
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

function calcOverall({ games = 0, goals = 0, assists = 0, xp = 0, checkins = 0 }) {
  const score =
    games * 2 +
    goals * 6 +
    assists * 4 +
    Math.floor(xp / 25) +
    Math.floor(checkins / 2);

  return clamp(10 + Math.floor(score / 6), 1, 99);
}

function calcAttributes({ games = 0, goals = 0, assists = 0, xp = 0, checkins = 0 }) {
  const overall = calcOverall({ games, goals, assists, xp, checkins });
  const pace = clamp(overall + Math.floor(checkins / 2), 10, 99);
  const shooting = clamp(overall + goals * 2, 10, 99);
  const passing = clamp(overall + assists * 3, 10, 99);
  const stamina = clamp(overall + Math.floor(games / 2) + Math.floor(xp / 50), 10, 99);

  return { overall, pace, shooting, passing, stamina };
}

function PlayerFigure({ overall = 50 }) {
  return (
    <div className={styles.heroFigure} title={`Overall ${overall}`}>
      <svg className={styles.figureSvg} viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id="g1" cx="35%" cy="25%" r="70%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="70%" stopColor="var(--primary)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--primary-2)" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="shorts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <circle cx="60" cy="60" r="58" fill="url(#g1)" opacity="0.9" />

        <circle cx="60" cy="38" r="16" fill="color-mix(in srgb, var(--surface-solid) 70%, #ffd7b3)" />
        <path
          d="M44 36c4-12 29-12 32 0c-6-7-26-7-32 0z"
          fill="color-mix(in srgb, var(--text) 60%, #000)"
          opacity="0.9"
        />
        <circle cx="54" cy="40" r="2.2" fill="color-mix(in srgb, var(--text) 80%, #000)" />
        <circle cx="66" cy="40" r="2.2" fill="color-mix(in srgb, var(--text) 80%, #000)" />
        <path
          d="M54 48c4 4 8 4 12 0"
          stroke="color-mix(in srgb, var(--text) 55%, #000)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />

        <path d="M40 62c6-14 34-14 40 0v14c0 8-9 16-20 16s-20-8-20-16V62z" fill="url(#shirt)" />
        <circle cx="70" cy="70" r="7" fill="var(--accent)" opacity="0.9" />
        <text x="70" y="73" textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--on-accent)">
          {String(overall).padStart(2, "0")}
        </text>

        <path d="M44 78h32v10c0 6-8 12-16 12s-16-6-16-12V78z" fill="url(#shorts)" />
        <rect x="52" y="88" width="8" height="20" rx="4" fill="color-mix(in srgb, var(--surface-solid) 70%, #ffd7b3)" />
        <rect x="60" y="88" width="8" height="20" rx="4" fill="color-mix(in srgb, var(--surface-solid) 70%, #ffd7b3)" />

        <path
          d="M48 108h16c0 6-6 10-12 10h-8c-2 0-4-2-4-4c0-3 3-6 8-6z"
          fill="color-mix(in srgb, var(--text) 65%, #000)"
          opacity="0.9"
        />
        <path
          d="M56 108h16c0 6-6 10-12 10h-8c-2 0-4-2-4-4c0-3 3-6 8-6z"
          fill="color-mix(in srgb, var(--text) 65%, #000)"
          opacity="0.9"
        />

        <circle cx="28" cy="96" r="10" fill="color-mix(in srgb, var(--surface-solid) 70%, #fff)" />
        <path d="M22 96h12M28 90v12" stroke="color-mix(in srgb, var(--text) 45%, #000)" strokeWidth="2" opacity="0.6" />
      </svg>
    </div>
  );
}

function Attr({ label, value }) {
  const pct = clamp(Number(value) || 0, 0, 99);
  return (
    <div className={styles.attr}>
      <div className={styles.attrTop}>
        <span>{label}</span>
        <span>{pct}</span>
      </div>
      <div className={styles.attrBar}>
        <div className={styles.attrFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function timeAgo(ts) {
  // suporta number (antigo) ou ISO (novo)
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
    const scoreTxt = (sh !== "" || sa !== "") ? `${sh || 0}x${sa || 0}` : "";
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

  // ✅ NOVO: collapsibles (Overall/Hero + Tabs)
  const [heroOpen, setHeroOpen] = useState(true);
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

      stats: p?.stats || user?.stats || { goals: 0, assists: 0, gamesPlayed: 0 },
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

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <div className={styles.avatarWrap}>
              <img src={merged.avatar} alt="" className={styles.avatar} />
            </div>

            <div className={styles.identity}>
              <div className={styles.nameRow}>
                <div className={styles.name}>{merged.name}</div>
                {merged.role === "admin" ? <Pill>⚙️ Admin</Pill> : null}
                {merged.role === "arena_owner" ? <Pill>🏟️ Arena</Pill> : null}
                {merged.role === "owner" ? <Pill>🧠 Organizador</Pill> : null}
                {merged.username ? <Pill>@{merged.username}</Pill> : <Pill>Sem @</Pill>}
              </div>

              <div className={styles.meta}>
                {merged.position} • {merged.level} • {merged.foot}
              </div>

              <div className={styles.meta2}>
                {merged.bairro ? `${merged.bairro} • ` : ""}
                {merged.city}
              </div>

              <div className={styles.pillsRow}>
                <Pill>⭐ OVR {attr.overall}</Pill>
                <Pill>🔥 Lv {socialLevel}</Pill>
                <Pill>⚡ {socialXp} XP</Pill>
                <Pill>📍 {totalCheckins} check-ins</Pill>
                <Pill>⚽ {merged.stats?.gamesPlayed || 0} jogos</Pill>
              </div>
            </div>
          </div>

          <div className={styles.headerRight}>
            {!iAmViewingSomeone ? null : (
              <>
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
                  ⚔️ Desafiar com meu time
                </button>

                <button
                  type="button"
                  className={styles.ghostBtnWide}
                  onClick={() => onStartChat?.({ id: targetUserId, name: merged.name, avatar: merged.avatar })}
                >
                  💬 Conversar
                </button>
              </>
            )}
          </div>
        </div>

        {merged.bio ? (
          <div className={styles.bio}>{merged.bio}</div>
        ) : (
          <div className={styles.bioMuted}>
            {iAmViewingSomeone ? "Sem bio por enquanto." : "Sem bio ainda — clica no menu (⋯) e edita seu perfil 😉"}
          </div>
        )}

        {merged.tags?.length ? (
          <div className={styles.tagsRow}>
            {merged.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {/* ✅ Collapsible: Overall + Boneco */}
        <div className={styles.heroPanel}>
          {heroOpen ? (
            <>
              <PlayerFigure overall={attr.overall} />

              <div className={styles.heroStats}>
                <div className={styles.ovrRow}>
                  <div className={styles.ovrBadge}>
                    <div className={styles.ovrNum}>{attr.overall}</div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 1000, lineHeight: 1.1 }}>Overall</div>
                      <div style={{ color: "var(--muted)", fontWeight: 900, fontSize: 12 }}>
                        baseado em jogos, gols, assist., XP e check-ins
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.chevBtn}
                      onClick={() => setHeroOpen(false)}
                      aria-label="Ocultar overall"
                      title="Ocultar"
                    >
                      ▾
                    </button>
                  </div>

                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.ghostBtnWide}
                      onClick={() => safeCopy(targetUserId, "ID copiado ✅")}
                    >
                      🆔 Copiar ID
                    </button>
                    <button
                      type="button"
                      className={styles.ghostBtnWide}
                      onClick={() => safeCopy(shareText, "Copiado ✅")}
                    >
                      📤 Copiar @/ID
                    </button>
                  </div>
                </div>

                <div className={styles.attrGrid}>
                  <Attr label="🏃 Ritmo" value={attr.pace} />
                  <Attr label="🎯 Finalização" value={attr.shooting} />
                  <Attr label="🎁 Passe" value={attr.passing} />
                  <Attr label="🫀 Fôlego" value={attr.stamina} />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.heroCollapsed}>
              <div className={styles.heroCollapsedLeft}>
                <span className={styles.heroCollapsedLabel}>⭐ Overall</span>
                <span className={styles.heroCollapsedValue}>{attr.overall}</span>
                <span className={styles.heroCollapsedHint}>toque para abrir</span>
              </div>

              <button
                type="button"
                className={styles.chevBtn}
                onClick={() => setHeroOpen(true)}
                aria-label="Mostrar overall"
                title="Mostrar"
              >
                ▸
              </button>
            </div>
          )}
        </div>

        {/* ✅ Collapsible: Tabs (Feed/Social/Amigos/...) */}
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

        {tab === "overview" ? (
          <div className={`${styles.grid2} ${styles.gridFull}`}>
            <div className={styles.block}>
              <div className={styles.feedTop}>
                <div className={styles.blockTitle}>📰 Seu Feed</div>
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

            {/* Wallet removida do Perfil (já existe na View Wallet do AppShell) */}

          </div>
        ) : null}

        {tab === "social" ? (
          <div className={styles.grid2}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>🌐 Social do BóPôFut</div>
              <div className={styles.softCard}>
                <div className={styles.softTitle}>Status / presença / desafios</div>
                <div className={styles.softHint}>
                  Aqui entra: presença em praças, últimos check-ins, desafios recebidos, etc.
                </div>
                <div className={styles.pillsRow} style={{ marginTop: 10 }}>
                  <Pill>🔥 Lv {socialLevel}</Pill>
                  <Pill>⚡ {socialXp} XP</Pill>
                  <Pill>📍 {totalCheckins} check-ins</Pill>
                </div>
              </div>
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>📌 Links rápidos</div>

              <div className={styles.softCard}>
                <div className={styles.softTitle}>Compartilhar</div>
                <div className={styles.softHint}>Copie seu @ ou ID pra mandar no WhatsApp/Instagram.</div>

                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.ghostBtnWide}
                    onClick={() => safeCopy(targetUserId, "ID copiado ✅")}
                  >
                    🆔 Copiar ID
                  </button>
                  <button
                    type="button"
                    className={styles.ghostBtnWide}
                    onClick={() => safeCopy(shareText, "Copiado ✅")}
                  >
                    📤 Copiar @/ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "friends" && !iAmViewingSomeone ? (
          <div className={styles.grid2}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>👥 Amigos (oficial)</div>

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
                                  {status === "ONLINE"
                                    ? "🟢 Online"
                                    : status === "IN_MATCH"
                                    ? "🟡 Em jogo"
                                    : "⚪ Offline"}
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
                </>
              )}
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>🌐 Amigos (Lite)</div>
              <ProfileFriendsLite user={user} />
            </div>
          </div>
        ) : null}

        {tab === "official" ? (
          <div className={styles.grid2}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>🏆 Perfil oficial (core)</div>
              <div className={styles.softCard}>
                <div className={styles.softTitle}>Seu core do BóPôFut</div>
                <div className={styles.softHint}>
                  Aqui é onde entram partidas oficiais, números e histórico validado.
                </div>

                <div className={styles.pillsRow} style={{ marginTop: 12 }}>
                  <Pill>⚽ Partidas: {merged.stats?.gamesPlayed || 0}</Pill>
                  <Pill>🥅 Gols: {merged.stats?.goals || 0}</Pill>
                  <Pill>🎁 Assist.: {merged.stats?.assists || 0}</Pill>
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

            <div className={styles.block}>
              <div className={styles.blockTitle}>📌 Observação</div>
              <div className={styles.softCard}>
                <div className={styles.softTitle}>404 tratado</div>
                <div className={styles.softHint}>
                  Seu front tentava chamar <b>/users/me/profile</b>, mas seu backend ainda não tem esse endpoint.
                  Agora a gente considera 404 como “ok” e usa dados locais (user/social-lite) pra não quebrar sua UI.
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
