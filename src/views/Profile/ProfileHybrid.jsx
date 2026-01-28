// src/views/Profile/ProfileHybrid.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "./ProfileHybrid.module.css";

// ✅ UI oficial existente (não vamos quebrar seu “core”)
import PlayerCard from "./components/Playercard.jsx";
import WalletCard from "./components/WalletCard.jsx";
import AchievementsGrid from "./components/AchievementsGrid.jsx";
import OwnerManagement from "./components/OwnerManagement.jsx";
import AchievementModal from "./components/modals/AchievementModal.jsx";
import MiniAchievementModal from "./components/modals/MiniAchievementModal.jsx";

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

export default function ProfileHybrid({
  // ✅ compat (igual Profile / ProfileV2)
  user,
  matches,
  courts,
  onOpenWallet,
  onEditProfile,
  onBack,
  onLogout,

  // navegação existente do seu perfil oficial
  onOpenOrganizerPanel,
  onOpenArenaPanel,
  onOpenAgenda,
  onOpenFinance,
  onOpenPromotions,
  onOpenAccountSettings,

  // ✅ público: se vier preenchido => abre perfil de outra pessoa
  viewedUserId,

  // ✅ “A”: quando clicar em “Desafiar com meu time”
  onStartChallenge, // (targetUser) => void

  // ✅ opcional: abrir chat direto
  onStartChat, // (targetUser) => void
}) {
  const isPublic = !!viewedUserId && !isSameId(viewedUserId, user?.id);
  const targetUserId = isPublic ? viewedUserId : user?.id;

  const [tab, setTab] = useState("overview"); // overview | social | friends | official | achievements | management
  const [editOpen, setEditOpen] = useState(false);

  // modais oficial
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [miniGadgetAchievement, setMiniGadgetAchievement] = useState(null);

  // backend profile (oficial)
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // social-lite
  const [socialProfile, setSocialProfileState] = useState(null);
  const [socialStats, setSocialStatsState] = useState(null);

  // friends backend
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [presenceMap, setPresenceMap] = useState({});

  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const isOrganizer = (profile?.role || user?.role) === "owner";
  const isArenaOwner = (profile?.role || user?.role) === "arena_owner";

  // ---------- Loaders ----------
async function refreshOfficial() {
  if (!targetUserId) return;

  // ✅ Se é meu perfil mas não tô logado ainda, não tenta buscar
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
    setProfile(null);

    // ✅ Mensagem mais “premium” e útil
    const msg =
      err?.message?.includes("401") || err?.message?.toLowerCase?.().includes("unauthorized")
        ? "Sua sessão expirou. Faça login novamente."
        : err?.message || "Erro ao carregar perfil 😬";

    setProfileError(msg);
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
      const [f, inc, out] = await Promise.all([
        listFriends(),
        listIncomingRequests(),
        listOutgoingRequests(),
      ]);
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
    } catch {
      // silencioso
    }
  }

  // ---------- Effects ----------
  useEffect(() => {
    refreshOfficial();
    refreshSocial();
    setTab("overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

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

  // ---------- Merge: social + oficial ----------
  const merged = useMemo(() => {
    const s = socialProfile || {};
    const p = profile || {};

    const baseName = p?.name || user?.name || s?.name || "Jogador";
    const avatar =
      s?.avatar ||
      p?.avatar ||
      user?.avatar ||
      "https://picsum.photos/seed/user/240";

    return {
      id: targetUserId,
      name: baseName,
      role: p?.role || user?.role || "user",
      email: p?.email || user?.email || "",
      avatar,

      // social-lite
      username: s?.username || "",
      city: s?.city || "Curitiba",
      bairro: s?.bairro || "",
      position: s?.position || user?.position || "Meia",
      level: s?.level || user?.level || "Médio",
      foot: s?.foot || "Destro",
      bio: s?.bio || "",
      tags: Array.isArray(s?.tags) ? s.tags : [],

      // oficial
      stats: p?.stats || user?.stats || { goals: 0, assists: 0, gamesPlayed: 0 },
      unlockedAchievementIds: p?.unlockedAchievementIds || user?.unlockedAchievementIds || [],
      walletBalance: p?.walletBalance ?? user?.walletBalance ?? 0,
    };
  }, [profile, socialProfile, targetUserId, user]);

  const socialLevel = socialStats?.level || 1;
  const socialXp = socialStats?.xp || 0;
  const totalCheckins = socialStats?.totalCheckins || 0;

  // ---------- Friend state (público) ----------
  const iAmLogged = !!user?.id;
  const iAmViewingSomeone = isPublic;

  const alreadyFriend = useMemo(() => {
    if (!iAmLogged || !iAmViewingSomeone) return false;
    return friends.some((f) => isSameId(f?.id, targetUserId));
  }, [friends, iAmLogged, iAmViewingSomeone, targetUserId]);

  const outgoingPending = useMemo(() => {
    if (!iAmLogged || !iAmViewingSomeone) return false;
    return outgoing.some(
      (r) => isSameId(r?.toUserId, targetUserId) || isSameId(r?.toId, targetUserId)
    );
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

  // ---------- Edit social (só meu perfil) ----------
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

  // ---------- Header CTAs ----------
  const shareText = merged.username ? `@${merged.username}` : `ID: ${targetUserId}`;

  // ---------- Render ----------
  return (
    <div className={styles.page}>
      {/* HEADER CARD */}
      <div className={styles.headerCard}>
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
              <Pill>🔥 Lv {socialLevel}</Pill>
              <Pill>⚡ {socialXp} XP</Pill>
              <Pill>📍 {totalCheckins} check-ins</Pill>
              <Pill>⚽ {merged.stats?.gamesPlayed || 0} jogos</Pill>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* MEU PERFIL */}
          {!iAmViewingSomeone ? (
            <>
              <button type="button" className={styles.primaryBtn} onClick={() => setEditOpen(true)}>
                ✏️ Editar Perfil
              </button>

              <button type="button" className={styles.ghostBtnWide} onClick={onEditProfile}>
                ⚙️ Configurações
              </button>

              <button type="button" className={styles.ghostBtnWide} onClick={() => onOpenWallet?.()}>
                💳 Wallet
              </button>
            </>
          ) : (
            <>
              {/* PERFIL PÚBLICO */}
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
                onClick={() =>
                  onStartChallenge?.({ id: targetUserId, name: merged.name, avatar: merged.avatar })
                }
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

        {merged.bio ? (
          <div className={styles.bio}>{merged.bio}</div>
        ) : (
          <div className={styles.bioMuted}>
            {iAmViewingSomeone ? "Sem bio por enquanto." : "Sem bio ainda — clica em Editar e coloca sua descrição 😉"}
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

        {/* TABS */}
        <div className={styles.tabsRow}>
          <Tab active={tab === "overview"} onClick={() => setTab("overview")}>
            🧩 Visão
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
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        {/* LOADING/ERROR (oficial) */}
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

        {/* TAB: OVERVIEW */}
        {tab === "overview" ? (
          <div className={styles.grid2}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>👤 Card do Jogador</div>
              <PlayerCard user={merged} />
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>📊 Stats rápidos</div>

              <div className={styles.kpiGrid}>
                <div className={styles.kpi}>
                  <div className={styles.kpiLabel}>Partidas</div>
                  <div className={styles.kpiValue}>{merged.stats?.gamesPlayed || 0}</div>
                </div>
                <div className={styles.kpi}>
                  <div className={styles.kpiLabel}>Gols</div>
                  <div className={styles.kpiValue}>{merged.stats?.goals || 0}</div>
                </div>
                <div className={styles.kpi}>
                  <div className={styles.kpiLabel}>Assist.</div>
                  <div className={styles.kpiValue}>{merged.stats?.assists || 0}</div>
                </div>
                <div className={styles.kpi}>
                  <div className={styles.kpiLabel}>Check-ins</div>
                  <div className={styles.kpiValue}>{totalCheckins}</div>
                </div>
              </div>

              {!iAmViewingSomeone ? (
                <div className={styles.miniRow}>
                  <WalletCard user={merged} onOpenWallet={onOpenWallet} />
                </div>
              ) : (
                <div className={styles.softHint}>
                  Wallet é privada. (Se quiser, depois a gente mostra só “nível da wallet” público.)
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* TAB: SOCIAL */}
        {tab === "social" ? (
          <div className={styles.grid2}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>🌐 Social do BóPôFut</div>
              <div className={styles.softCard}>
                <div className={styles.softTitle}>Status / presença / feed</div>
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

        {/* TAB: FRIENDS (somente eu) */}
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

        {/* TAB: OFFICIAL */}
        {tab === "official" ? (
          <div className={styles.grid2}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>🏆 Perfil oficial (core)</div>
              <div className={styles.softCard}>
                <div className={styles.softTitle}>Seu core do BóPôFut</div>
                <div className={styles.softHint}>
                  Aqui é onde entram partidas oficiais, números e histórico validado.
                </div>
                <div className={styles.kpiGrid} style={{ marginTop: 12 }}>
                  <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Partidas</div>
                    <div className={styles.kpiValue}>{merged.stats?.gamesPlayed || 0}</div>
                  </div>
                  <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Gols</div>
                    <div className={styles.kpiValue}>{merged.stats?.goals || 0}</div>
                  </div>
                  <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Assist.</div>
                    <div className={styles.kpiValue}>{merged.stats?.assists || 0}</div>
                  </div>
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
              <div className={styles.blockTitle}>💳 Wallet</div>
              {!iAmViewingSomeone ? (
                <WalletCard user={merged} onOpenWallet={onOpenWallet} />
              ) : (
                <div className={styles.softCard}>
                  <div className={styles.softTitle}>Privado</div>
                  <div className={styles.softHint}>Wallet é visível apenas pro dono do perfil.</div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* TAB: ACHIEVEMENTS */}
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

        {/* TAB: MANAGEMENT */}
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

      {/* MODAL: editar social */}
      {!iAmViewingSomeone ? (
        <EditPublicProfile
          open={editOpen}
          initial={merged}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveSocial}
        />
      ) : null}

      {/* MODAIS oficiais */}
      {selectedAchievement ? (
        <AchievementModal achievement={selectedAchievement} onClose={() => setSelectedAchievement(null)} />
      ) : null}

      {miniGadgetAchievement ? (
        <MiniAchievementModal achievement={miniGadgetAchievement} onClose={() => setMiniGadgetAchievement(null)} />
      ) : null}
    </div>
  );
}
