// src/views/Profile/ProfileV2.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "./ProfileV2.module.css";

import PlayerCard from "./components/Playercard.jsx";
import WalletCard from "./components/WalletCard.jsx";
import AchievementsGrid from "./components/AchievementsGrid.jsx";
import OwnerManagement from "./components/OwnerManagement.jsx";

import AchievementModal from "./components/modals/AchievementModal.jsx";
import MiniAchievementModal from "./components/modals/MiniAchievementModal.jsx";

import { getMyProfile, getPublicProfile } from "../../services/profile/profileApi.js";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
} from "../../services/profile/friendsApi.js";
import { getFriendsPresence, heartbeat } from "../../services/profile/presenceApi.js";

// ✅ IMPORTANTE: aqui não tem mock de dados.
// Se backend ainda não tiver endpoints, a UI mostra estados vazios/erro sem inventar conteúdo.

const TABS = [
  { key: "overview", label: "Visão Geral" },
  { key: "friends", label: "Amigos" },
  { key: "stats", label: "Estatísticas" },
  { key: "history", label: "Histórico" },
  { key: "achievements", label: "Conquistas" },
  { key: "compare", label: "Comparar" },
];

function presenceDotColor(status) {
  // Não define cor aqui via CSS vars; usamos classes simples via inline
  if (status === "ONLINE") return "rgba(34,197,94,.95)";
  if (status === "IN_MATCH") return "rgba(251,191,36,.95)";
  return "rgba(148,163,184,.9)";
}

export default function ProfileV2({
  // Mantém compatibilidade com seu app atual:
  user,
  matches,
  courts,
  onOpenWallet,
  onEditProfile,
  onBack,
  onLogout,

  // navegação existente
  onOpenOrganizerPanel,
  onOpenArenaPanel,
  onOpenAgenda,
  onOpenFinance,
  onOpenPromotions,
  onOpenAccountSettings,

  // ✅ novo: se quiser abrir perfil público de outra pessoa
  viewedUserId, // se vazio/null => meu perfil
}) {
  const [tab, setTab] = useState("overview");

  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [miniGadgetAchievement, setMiniGadgetAchievement] = useState(null);

  // dados do backend (quando existir)
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [presenceMap, setPresenceMap] = useState({}); // userId -> {status, currentMatchId}

  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");

  const [actionBusy, setActionBusy] = useState("");

  // ✅ roles (sem confusão)
  const isOrganizer = (profile?.role ?? user?.role) === "owner";
  const isArenaOwner = (profile?.role ?? user?.role) === "arena_owner";
  const isPlayer = !isOrganizer && !isArenaOwner;

  const isMyProfile = !viewedUserId || viewedUserId === (user?.id ?? profile?.id);

  const safeUser = useMemo(() => {
    // fallback mínimo usando user prop (auth já existe)
    const base = user || {
      id: "me",
      name: "Usuário",
      avatar: "",
      role: "user",
      isVerified: false,
      walletBalance: 0,
      stats: { goals: 0, assists: 0, gamesPlayed: 0 },
      unlockedAchievementIds: [],
    };

    // se perfil veio do backend, ele manda por cima
    if (!profile) return base;

    return {
      ...base,
      ...profile,
      // stats padronizadas
      stats: {
        goals: profile?.stats?.goals ?? base?.stats?.goals ?? 0,
        assists: profile?.stats?.assists ?? base?.stats?.assists ?? 0,
        gamesPlayed: profile?.stats?.matchesPlayed ?? base?.stats?.gamesPlayed ?? 0,
        wins: profile?.stats?.wins ?? 0,
        draws: profile?.stats?.draws ?? 0,
        losses: profile?.stats?.losses ?? 0,
        mvps: profile?.stats?.mvps ?? 0,
        rating: profile?.stats?.rating ?? profile?.rating ?? 0,
        position: profile?.stats?.position ?? profile?.position ?? "",
      },
      unlockedAchievementIds: profile?.unlockedAchievementIds ?? base?.unlockedAchievementIds ?? [],
    };
  }, [user, profile]);

  const roleLabel = useMemo(() => {
    if (isArenaOwner) return "Arena Owner";
    if (isOrganizer) return "Organizador";
    return "Jogador";
  }, [isArenaOwner, isOrganizer]);

  const myPresence = useMemo(() => {
    // backend futuro deve mandar presence no profile
    return profile?.presence?.status || "OFFLINE";
  }, [profile]);

  // ===== Achievements helpers (mantém compatibilidade com sua UI atual) =====
  function getProgress(achievement, targetUser = safeUser) {
    if (!achievement || !targetUser) return 0;
    const stats = targetUser.stats || { goals: 0, assists: 0, gamesPlayed: 0 };
    switch (achievement.category) {
      case "goals":
        return Math.min(100, (stats.goals / achievement.targetValue) * 100);
      case "assists":
        return Math.min(100, (stats.assists / achievement.targetValue) * 100);
      case "games":
        return Math.min(100, (stats.gamesPlayed / achievement.targetValue) * 100);
      default:
        return (targetUser.unlockedAchievementIds || []).includes(achievement.id) ? 100 : 30;
    }
  }

  function getStatusLabel(achievement, targetUser = safeUser) {
    if (!achievement || !targetUser) return "";
    const stats = targetUser.stats || { goals: 0, assists: 0, gamesPlayed: 0 };
    switch (achievement.category) {
      case "goals":
        return `${stats.goals}/${achievement.targetValue} gols`;
      case "assists":
        return `${stats.assists}/${achievement.targetValue} assistências`;
      case "games":
        return `${stats.gamesPlayed}/${achievement.targetValue} partidas`;
      default:
        return (targetUser.unlockedAchievementIds || []).includes(achievement.id)
          ? "Concluído"
          : "Em andamento";
    }
  }

  // ===== Fetch Profile =====
  useEffect(() => {
    let alive = true;

    async function run() {
      setProfileLoading(true);
      setProfileError("");

      try {
        const data = viewedUserId ? await getPublicProfile(viewedUserId) : await getMyProfile();
        if (!alive) return;
        setProfile(data);
      } catch (e) {
        if (!alive) return;
        setProfile(null);
        setProfileError(e?.message || "Não foi possível carregar o perfil (API indisponível).");
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [viewedUserId]);

  // ===== Fetch Friends + Presence =====
  useEffect(() => {
    if (!isMyProfile) return;

    let alive = true;

    async function run() {
      setFriendsLoading(true);
      setFriendsError("");

      try {
        // opcional: heartbeat mantém status ONLINE quando backend existir
        heartbeat().catch(() => {});

        const [f, inc, out, pres] = await Promise.all([
          listFriends(),
          listIncomingRequests(),
          listOutgoingRequests(),
          getFriendsPresence(),
        ]);

        if (!alive) return;

        setFriends(Array.isArray(f) ? f : []);
        setIncoming(Array.isArray(inc) ? inc : []);
        setOutgoing(Array.isArray(out) ? out : []);

        // presence esperado: [{ userId, status, currentMatchId }]
        const map = {};
        (Array.isArray(pres) ? pres : []).forEach((p) => {
          if (p?.userId) map[p.userId] = p;
        });
        setPresenceMap(map);
      } catch (e) {
        if (!alive) return;
        setFriends([]);
        setIncoming([]);
        setOutgoing([]);
        setPresenceMap({});
        setFriendsError(e?.message || "Não foi possível carregar amigos (API indisponível).");
      } finally {
        if (!alive) return;
        setFriendsLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [isMyProfile]);

  // ===== Actions =====
  async function handleAccept(friendshipId) {
    if (!friendshipId) return;
    setActionBusy(`accept:${friendshipId}`);
    try {
      await acceptFriendRequest(friendshipId);
      // refresh
      const [f, inc] = await Promise.all([listFriends(), listIncomingRequests()]);
      setFriends(Array.isArray(f) ? f : []);
      setIncoming(Array.isArray(inc) ? inc : []);
    } catch (e) {
      setFriendsError(e?.message || "Erro ao aceitar pedido.");
    } finally {
      setActionBusy("");
    }
  }

  async function handleDecline(friendshipId) {
    if (!friendshipId) return;
    setActionBusy(`decline:${friendshipId}`);
    try {
      await declineFriendRequest(friendshipId);
      const inc = await listIncomingRequests();
      setIncoming(Array.isArray(inc) ? inc : []);
    } catch (e) {
      setFriendsError(e?.message || "Erro ao recusar pedido.");
    } finally {
      setActionBusy("");
    }
  }

  async function handleSendRequest(toUserId) {
    if (!toUserId) return;
    setActionBusy(`request:${toUserId}`);
    try {
      await sendFriendRequest(toUserId);
      const out = await listOutgoingRequests();
      setOutgoing(Array.isArray(out) ? out : []);
    } catch (e) {
      setFriendsError(e?.message || "Erro ao enviar pedido.");
    } finally {
      setActionBusy("");
    }
  }

  // ===== Render =====
  return (
    <div className={styles.page}>
      {/* topo */}
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => onBack?.()}
          aria-label="Voltar"
          title="Voltar"
        >
          ←
        </button>

        <div className={styles.topTitle}>
          Perfil V2 <span style={{ opacity: 0.7, fontWeight: 900 }}>• {roleLabel}</span>
        </div>

        <div />
      </div>

      {/* header do perfil (V2) */}
      <section className={styles.header}>
        <div className={styles.headerRow}>
          <img
            className={styles.avatar}
            src={safeUser.avatar || "https://via.placeholder.com/160x160?text=Avatar"}
            alt={safeUser.name || "Usuário"}
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/160x160?text=Avatar";
            }}
          />

          <div style={{ minWidth: 0 }}>
            <h2 className={styles.hName}>
              {safeUser.name || "Usuário"}{" "}
              {safeUser.isVerified ? <span title="Verificado">✔</span> : null}
            </h2>

            <div className={styles.hMeta}>
              <span className={`${styles.pill} ${styles.pillStrong}`}>
                <span
                  className={styles.dot}
                  style={{ background: presenceDotColor(myPresence) }}
                />
                {myPresence === "IN_MATCH"
                  ? "Em jogo"
                  : myPresence === "ONLINE"
                  ? "Online"
                  : "Offline"}
              </span>

              <span className={styles.pill}>
                Posição: <b className={styles.pillStrong}>{safeUser.stats?.position || "—"}</b>
              </span>

              <span className={styles.pill}>
                Rating: <b className={styles.pillStrong}>{safeUser.stats?.rating || 0}</b>
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            {isMyProfile ? (
              <>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onEditProfile?.()}>
                  Editar
                </button>
                <button type="button" className={styles.btn} onClick={() => onOpenAccountSettings?.()}>
                  Conta
                </button>
              </>
            ) : (
              <>
                {/* Em perfil público: no futuro, aqui entra o estado real (já amigos / pendente / aceitar etc.) */}
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => handleSendRequest(safeUser.id)}
                  disabled={actionBusy === `request:${safeUser.id}`}
                  title="Enviar pedido de amizade"
                >
                  + Amigo
                </button>
                <button type="button" className={styles.btn} title="Comparar" onClick={() => setTab("compare")}>
                  Comparar
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.grid3}>
          <Kpi label="Gols" value={safeUser.stats?.goals ?? 0} />
          <Kpi label="Assists" value={safeUser.stats?.assists ?? 0} />
          <Kpi label="Jogos" value={safeUser.stats?.gamesPlayed ?? 0} />
        </div>

        {profileLoading ? (
          <div style={{ marginTop: 10 }} className={styles.muted}>
            Carregando perfil...
          </div>
        ) : profileError ? (
          <div style={{ marginTop: 10 }} className={styles.muted}>
            {profileError}
          </div>
        ) : null}
      </section>

      {/* cards existentes do teu perfil (reaproveitamos) */}
      <PlayerCard
        user={safeUser}
        role={safeUser?.role}
        achievements={safeUser?.achievementsCatalog || []}
        onMiniAchievement={setMiniGadgetAchievement}
      />

      <WalletCard user={safeUser} onOpenWallet={() => onOpenWallet?.()} />

      {/* tabs */}
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* painel */}
      <section className={styles.panel}>
        {tab === "overview" && (
          <OverviewPanel
            isPlayer={isPlayer}
            safeUser={safeUser}
            matches={matches}
            friendsCount={friends.length}
            pendingCount={incoming.length}
          />
        )}

        {tab === "friends" && (
          <FriendsPanel
            isMyProfile={isMyProfile}
            loading={friendsLoading}
            error={friendsError}
            friends={friends}
            incoming={incoming}
            outgoing={outgoing}
            presenceMap={presenceMap}
            actionBusy={actionBusy}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}

        {tab === "stats" && <StatsPanel safeUser={safeUser} />}

        {tab === "history" && <HistoryPanel matches={matches} safeUser={safeUser} />}

        {tab === "achievements" && (
          <div>
            <h3 className={styles.panelTitle}>Conquistas</h3>
            <div className={styles.muted}>
              Quando o backend estiver pronto, aqui vamos usar:
              <b> /achievements/me</b> e <b>/achievements/catalog</b>.
            </div>

            {/* Mantemos o componente, mas você vai ligar com dados reais depois */}
            <div style={{ marginTop: 12 }}>
              <AchievementsGrid
                user={safeUser}
                achievements={safeUser?.achievementsCatalog || []}
                onSelectAchievement={setSelectedAchievement}
              />
            </div>
          </div>
        )}

        {tab === "compare" && <ComparePanel me={user} other={safeUser} />}
      </section>

      {/* Conteúdo por role (mantido do Profile antigo) */}
      {!isPlayer && (
        <OwnerManagement
          role={safeUser?.role}
          onOpenOrganizerPanel={onOpenOrganizerPanel}
          onOpenArenaPanel={onOpenArenaPanel}
          onOpenAgenda={onOpenAgenda}
          onOpenFinance={onOpenFinance}
          onOpenPromotions={onOpenPromotions}
          onOpenAccountSettings={onOpenAccountSettings}
        />
      )}

      {/* Logout */}
      {isMyProfile && (
        <button type="button" onClick={() => onLogout?.()} className={styles.btn} style={{ marginTop: 14, width: "100%" }}>
          ⎋ Sair da Conta
        </button>
      )}

      {/* MODAIS */}
      {selectedAchievement && (
        <AchievementModal
          achievement={selectedAchievement}
          isUnlocked={(safeUser.unlockedAchievementIds || []).includes(selectedAchievement.id)}
          progress={getProgress(selectedAchievement)}
          statusLabel={getStatusLabel(selectedAchievement)}
          onClose={() => setSelectedAchievement(null)}
        />
      )}

      {miniGadgetAchievement && (
        <MiniAchievementModal
          achievement={miniGadgetAchievement}
          onClose={() => setMiniGadgetAchievement(null)}
        />
      )}
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
    </div>
  );
}

function OverviewPanel({ isPlayer, safeUser, matches, friendsCount, pendingCount }) {
  return (
    <div>
      <h3 className={styles.panelTitle}>Visão Geral</h3>

      <div className={styles.list}>
        <div className={styles.rowItem}>
          <div className={styles.leftRow}>
            <div style={{ fontWeight: 1100 }}>Seu Social</div>
          </div>
          <div className={styles.rightRow}>
            <span className={styles.pill}>
              Amigos: <b className={styles.pillStrong}>{friendsCount}</b>
            </span>
            <span className={styles.pill}>
              Pedidos: <b className={styles.pillStrong}>{pendingCount}</b>
            </span>
          </div>
        </div>

        <div className={styles.rowItem}>
          <div className={styles.leftRow}>
            <div className={styles.nameCol}>
              <div className={styles.nameLine}>Resumo</div>
              <div className={styles.subLine}>
                {isPlayer
                  ? "Gols, assists, jogos e forma recente (vai puxar do backend)"
                  : "Painéis e métricas por role (organizador/arena)"}
              </div>
            </div>
          </div>
          <div className={styles.rightRow}>
            <span className={styles.pill}>
              Rating: <b className={styles.pillStrong}>{safeUser.stats?.rating || 0}</b>
            </span>
            <span className={styles.pill}>
              Posição: <b className={styles.pillStrong}>{safeUser.stats?.position || "—"}</b>
            </span>
          </div>
        </div>

        <div className={styles.rowItem}>
          <div className={styles.leftRow}>
            <div className={styles.nameCol}>
              <div className={styles.nameLine}>Últimas Partidas</div>
              <div className={styles.subLine}>
                {Array.isArray(matches) && matches.length
                  ? `Você tem ${matches.length} partidas no app (fonte atual do front).`
                  : "Sem partidas carregadas no front ainda."}
              </div>
            </div>
          </div>
          <div className={styles.rightRow}>
            <span className={styles.pill}>Em breve: Destaques e MVP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FriendsPanel({
  isMyProfile,
  loading,
  error,
  friends,
  incoming,
  outgoing,
  presenceMap,
  actionBusy,
  onAccept,
  onDecline,
}) {
  return (
    <div>
      <h3 className={styles.panelTitle}>Amigos</h3>

      {!isMyProfile ? (
        <div className={styles.muted}>
          Perfil público: aqui entra a lista pública (se o usuário permitir) e botão de amizade.
        </div>
      ) : null}

      {loading ? <div className={styles.muted}>Carregando amigos…</div> : null}
      {error ? <div className={styles.muted}>{error}</div> : null}

      {/* Pedidos recebidos */}
      <div style={{ marginTop: 12 }}>
        <div className={styles.muted} style={{ marginBottom: 8 }}>
          Pedidos recebidos
        </div>

        {incoming.length === 0 ? (
          <div className={styles.muted}>Nenhum pedido recebido.</div>
        ) : (
          <div className={styles.list}>
            {incoming.map((r) => {
              const from = r.fromUser || r.requester || r.user || {};
              const id = r.id;
              return (
                <div key={id} className={styles.rowItem}>
                  <div className={styles.leftRow}>
                    <img
                      className={styles.smallAvatar}
                      src={from.avatar || "https://via.placeholder.com/96x96?text=U"}
                      alt={from.name || "Usuário"}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/96x96?text=U")}
                    />
                    <div className={styles.nameCol}>
                      <div className={styles.nameLine}>{from.name || "Usuário"}</div>
                      <div className={styles.subLine}>Quer te adicionar</div>
                    </div>
                  </div>

                  <div className={styles.rightRow}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => onAccept(id)}
                      disabled={actionBusy === `accept:${id}`}
                    >
                      Aceitar
                    </button>
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={() => onDecline(id)}
                      disabled={actionBusy === `decline:${id}`}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Amigos */}
      <div style={{ marginTop: 16 }}>
        <div className={styles.muted} style={{ marginBottom: 8 }}>
          Meus amigos
        </div>

        {friends.length === 0 ? (
          <div className={styles.muted}>
            Você ainda não tem amigos. Assim que o backend estiver pronto, essa lista vai vir de <b>/friends</b>.
          </div>
        ) : (
          <div className={styles.list}>
            {friends.map((f) => {
              // esperado: backend pode retornar { id, friend: {...} } ou direto user
              const friend = f.friend || f.user || f;
              const p = presenceMap[friend.id];
              const status = p?.status || "OFFLINE";

              return (
                <div key={f.id || friend.id} className={styles.rowItem}>
                  <div className={styles.leftRow}>
                    <img
                      className={styles.smallAvatar}
                      src={friend.avatar || "https://via.placeholder.com/96x96?text=U"}
                      alt={friend.name || "Usuário"}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/96x96?text=U")}
                    />
                    <div className={styles.nameCol}>
                      <div className={styles.nameLine}>
                        <span
                          className={styles.dot}
                          style={{ background: status === "ONLINE" ? "rgba(34,197,94,.95)" : status === "IN_MATCH" ? "rgba(251,191,36,.95)" : "rgba(148,163,184,.9)" }}
                        />
                        {friend.name || "Usuário"}
                      </div>
                      <div className={styles.subLine}>
                        {friend.position ? `Posição: ${friend.position}` : "Jogador"}
                        {" • "}
                        {status === "IN_MATCH" ? "Em jogo" : status === "ONLINE" ? "Online" : "Offline"}
                      </div>
                    </div>
                  </div>

                  <div className={styles.rightRow}>
                    <button type="button" className={styles.btn} title="Em breve: convidar para partida">
                      Convidar
                    </button>
                    <button type="button" className={styles.btn} title="Em breve: comparar">
                      Comparar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pedidos enviados */}
      <div style={{ marginTop: 16 }}>
        <div className={styles.muted} style={{ marginBottom: 8 }}>
          Pedidos enviados
        </div>

        {outgoing.length === 0 ? (
          <div className={styles.muted}>Nenhum pedido enviado.</div>
        ) : (
          <div className={styles.list}>
            {outgoing.map((r) => {
              const to = r.toUser || r.addressee || r.user || {};
              const id = r.id;
              return (
                <div key={id} className={styles.rowItem}>
                  <div className={styles.leftRow}>
                    <img
                      className={styles.smallAvatar}
                      src={to.avatar || "https://via.placeholder.com/96x96?text=U"}
                      alt={to.name || "Usuário"}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/96x96?text=U")}
                    />
                    <div className={styles.nameCol}>
                      <div className={styles.nameLine}>{to.name || "Usuário"}</div>
                      <div className={styles.subLine}>Aguardando resposta</div>
                    </div>
                  </div>

                  <div className={styles.rightRow}>
                    <span className={styles.pill}>Pendente</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsPanel({ safeUser }) {
  return (
    <div>
      <h3 className={styles.panelTitle}>Estatísticas</h3>
      <div className={styles.muted}>
        Backend futuro: <b>/users/:id/stats</b> (agregado) e <b>/users/:id/history</b> (por partida).
      </div>

      <div className={styles.grid3} style={{ marginTop: 12 }}>
        <Kpi label="Vitórias" value={safeUser.stats?.wins ?? 0} />
        <Kpi label="Empates" value={safeUser.stats?.draws ?? 0} />
        <Kpi label="Derrotas" value={safeUser.stats?.losses ?? 0} />
      </div>

      <div className={styles.grid3} style={{ marginTop: 10 }}>
        <Kpi label="MVPs" value={safeUser.stats?.mvps ?? 0} />
        <Kpi label="Rating" value={safeUser.stats?.rating ?? 0} />
        <Kpi label="Posição" value={safeUser.stats?.position || "—"} />
      </div>
    </div>
  );
}

function HistoryPanel({ matches, safeUser }) {
  const list = Array.isArray(matches) ? matches : [];

  return (
    <div>
      <h3 className={styles.panelTitle}>Histórico</h3>
      <div className={styles.muted}>
        Agora: usando lista que o front já recebe. Depois: <b>/users/:id/history</b> com paginação.
      </div>

      <div style={{ marginTop: 12 }} className={styles.list}>
        {list.length === 0 ? (
          <div className={styles.muted}>Sem partidas para exibir.</div>
        ) : (
          list.slice(0, 10).map((m) => (
            <div key={m.id} className={styles.rowItem}>
              <div className={styles.leftRow}>
                <div className={styles.nameCol}>
                  <div className={styles.nameLine}>{m.title || "Partida"}</div>
                  <div className={styles.subLine}>
                    {m.date || "—"} • {m.time || "—"} • {m.address || m.location || "Local não informado"}
                  </div>
                </div>
              </div>

              <div className={styles.rightRow}>
                <span className={styles.pill}>Ver</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12 }} className={styles.muted}>
        Jogador: <b>{safeUser?.name}</b> • Em breve: gols/assists por partida + destaques + MVP.
      </div>
    </div>
  );
}

function ComparePanel({ me, other }) {
  return (
    <div>
      <h3 className={styles.panelTitle}>Comparar</h3>
      <div className={styles.muted}>
        MVP: comparação real vem de <b>/compare/:me/:friend</b>. Agora: UI base.
      </div>

      <div className={styles.grid3} style={{ marginTop: 12 }}>
        <Kpi label="Você" value={me?.name || "—"} />
        <Kpi label="vs" value="⚔" />
        <Kpi label="Amigo" value={other?.name || "—"} />
      </div>

      <div className={styles.grid3} style={{ marginTop: 10 }}>
        <Kpi label="Gols" value={(me?.stats?.goals ?? 0) - (other?.stats?.goals ?? 0)} />
        <Kpi label="Assists" value={(me?.stats?.assists ?? 0) - (other?.stats?.assists ?? 0)} />
        <Kpi label="Jogos" value={(me?.stats?.gamesPlayed ?? 0) - (other?.stats?.gamesPlayed ?? 0)} />
      </div>

      <div className={styles.muted} style={{ marginTop: 12 }}>
        (Diferença: você − amigo) • Depois a gente troca por cards lado a lado.
      </div>
    </div>
  );
}
