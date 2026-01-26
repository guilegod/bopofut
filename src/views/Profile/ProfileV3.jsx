import { useMemo, useState } from "react";
import styles from "./ProfileV3.module.css";

import { achievements } from "../../mockData.js";

import PlayerCard from "./components/Playercard.jsx";
import WalletCard from "./components/WalletCard.jsx";
import AchievementsGrid from "./components/AchievementsGrid.jsx";
import OwnerManagement from "./components/OwnerManagement.jsx";

// (opcional — se você quiser usar “Seu Elenco”)
// import QuickFriends from "./components/QuickFriends.jsx";

import AchievementModal from "./components/modals/AchievementModal.jsx";
import MiniAchievementModal from "./components/modals/MiniAchievementModal.jsx";

function Pill({ children, tone = "muted" }) {
  const cls = tone === "primary" ? styles.pillPrimary : tone === "live" ? styles.pillLive : styles.pill;
  return <span className={cls}>{children}</span>;
}

function TabBtn({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.tabBtn} ${active ? styles.tabBtnActive : ""}`}
      onClick={onClick}
    >
      <span className={styles.tabIcon}>{icon}</span>
      <span className={styles.tabLabel}>{label}</span>
    </button>
  );
}

export default function ProfileV3({
  user,
  matches,
  courts,
  onOpenWallet,
  onEditProfile,
  onBack,
  onLogout,

  // ✅ navegação owner/arena_owner (mantida)
  onOpenOrganizerPanel,
  onOpenArenaPanel,
  onOpenAgenda,
  onOpenFinance,
  onOpenPromotions,
  onOpenAccountSettings,

  // ✅ opcionais pro “social” (não quebram se não existirem)
  friends = [],
  onOpenFriends,
  onSelectFriend,
}) {
  const [tab, setTab] = useState("overview"); // overview | social | achievements | management
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [miniGadgetAchievement, setMiniGadgetAchievement] = useState(null);

  // ✅ roles (igual seu Profile atual)
  const isOrganizer = user?.role === "owner";
  const isArenaOwner = user?.role === "arena_owner";
  const isPlayer = !isOrganizer && !isArenaOwner;

  const safeUser = user || {
    name: "Usuário",
    avatar: "",
    role: "user",
    stats: { goals: 0, assists: 0, gamesPlayed: 0 },
    unlockedAchievementIds: [],
    walletBalance: 0,
  };

  const roleLabel = useMemo(() => {
    if (isArenaOwner) return "Arena Owner";
    if (isOrganizer) return "Organizador";
    return "Jogador";
  }, [isArenaOwner, isOrganizer]);

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
        return (targetUser.unlockedAchievementIds || []).includes(achievement.id) ? "Concluído" : "Em andamento";
    }
  }

  const unlockedCount = (safeUser.unlockedAchievementIds || []).length;
  const games = safeUser.stats?.gamesPlayed ?? 0;

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => onBack?.()} aria-label="Voltar">
          ←
        </button>

        <div className={styles.topTitle}>
          Perfil <span className={styles.topMeta}>• {roleLabel}</span>
        </div>

        <div className={styles.topActions}>
          <button type="button" className={styles.ghostBtn} onClick={() => onOpenAccountSettings?.()}>
            ⚙
          </button>
        </div>
      </div>

      {/* HERO (Atleta) */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.heroRow}>
          <div className={styles.avatarWrap}>
            <img src={safeUser.avatar} alt={safeUser.name} className={styles.avatar} />
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <div className={styles.name}>{safeUser.name}</div>
              {safeUser.isVerified ? <Pill tone="live">✔ Verificado</Pill> : null}
              <Pill>{roleLabel}</Pill>
            </div>

            <div className={styles.miniLine}>
              <Pill tone="primary">🏆 {unlockedCount} conquistas</Pill>
              <Pill>🎮 {games} jogos</Pill>
              <Pill>💰 R$ {Number(safeUser.walletBalance || 0).toFixed(2)}</Pill>
            </div>

            <div className={styles.heroBtns}>
              <button type="button" className={styles.primaryBtn} onClick={() => onEditProfile?.()}>
                ✏️ Editar perfil
              </button>
              <button type="button" className={styles.ghostBtnWide} onClick={() => onOpenWallet?.()}>
                💳 Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Cards rápidos (mantém seus componentes) */}
        <div className={styles.quickGrid}>
          <div className={styles.quickCard}>
            <div className={styles.quickLabel}>Destaque</div>
            <div className={styles.quickValue}>{isPlayer ? "Craque BóPô Fut" : roleLabel}</div>
            <div className={styles.quickSub}>Seu perfil está ficando forte 🔥</div>
          </div>

          <div className={styles.quickCard}>
            <div className={styles.quickLabel}>Social</div>
            <div className={styles.quickValue}>{friends?.length || 0} amigos</div>
            <div className={styles.quickSub}>Rede esportiva em construção</div>
          </div>

          <div className={styles.quickCard}>
            <div className={styles.quickLabel}>Atividade</div>
            <div className={styles.quickValue}>{(matches || []).length} partidas</div>
            <div className={styles.quickSub}>Histórico vai ficar insano</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabsRow}>
        <TabBtn active={tab === "overview"} icon="🧾" label="Visão" onClick={() => setTab("overview")} />
        <TabBtn active={tab === "social"} icon="👥" label="Social" onClick={() => setTab("social")} />
        <TabBtn
          active={tab === "achievements"}
          icon="🎖️"
          label="Conquistas"
          onClick={() => setTab("achievements")}
        />
        {!isPlayer ? (
          <TabBtn active={tab === "management"} icon="🧰" label="Gestão" onClick={() => setTab("management")} />
        ) : null}
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        {tab === "overview" ? (
          <>
            {/* ✅ Reaproveita PlayerCard existente */}
            <PlayerCard user={safeUser} role={safeUser?.role} achievements={achievements} onMiniAchievement={setMiniGadgetAchievement} />

            {/* ✅ WalletCard existente */}
            <div className={styles.block}>
              <WalletCard user={safeUser} onOpenWallet={() => onOpenWallet?.()} />
            </div>

            {/* Atividade rápida (placeholder bonito) */}
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <div className={styles.blockTitle}>⚡ Últimas atividades</div>
                <div className={styles.blockMeta}>em breve</div>
              </div>

              <div className={styles.list}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.rowItem}>
                    <div>
                      <div className={styles.rowTitle}>Partida recente</div>
                      <div className={styles.rowSub}>Há {i} dias</div>
                    </div>
                    <div className={styles.rowBadge}>FINALIZADO</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {tab === "social" ? (
          <>
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <div className={styles.blockTitle}>👥 Social</div>
                <div className={styles.blockMeta}>{friends?.length || 0} amigos</div>
              </div>

              {/* Se você quiser usar QuickFriends, basta descomentar o import e trocar por ele */}
              {friends?.length ? (
                <div className={styles.friendGrid}>
                  {friends.slice(0, 8).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={styles.friendCard}
                      onClick={() => onSelectFriend?.(f)}
                      title="Abrir perfil"
                    >
                      <img src={f.avatar} alt={f.name} className={styles.friendAvatar} />
                      <div className={styles.friendName}>{String(f.name || "").split(" ")[0]}</div>
                      <div className={styles.friendSub}>{f.position || "Jogador"}</div>
                    </button>
                  ))}

                  <button type="button" className={styles.friendAdd} onClick={() => onOpenFriends?.()}>
                    <div className={styles.friendPlus}>＋</div>
                    <div className={styles.friendAddTxt}>Ver tudo</div>
                  </button>
                </div>
              ) : (
                <div className={styles.empty}>
                  <div className={styles.emptyTitle}>Seu elenco ainda está vazio</div>
                  <div className={styles.emptyHint}>Começa adicionando amigos e desafiando times.</div>
                  <button type="button" className={styles.primaryBtn} onClick={() => onOpenFriends?.()}>
                    ➕ Adicionar amigo
                  </button>
                </div>
              )}
            </div>

            <div className={styles.block}>
              <div className={styles.blockHead}>
                <div className={styles.blockTitle}>⚔️ Rivalidade</div>
                <div className={styles.blockMeta}>em breve</div>
              </div>
              <div className={styles.softInfo}>
                Aqui vai entrar: desafios recebidos/enviados, histórico vs rivais, e chat privado 1x1.
              </div>
            </div>
          </>
        ) : null}

        {tab === "achievements" ? (
          <>
            <AchievementsGrid user={safeUser} achievements={achievements} onSelectAchievement={setSelectedAchievement} />
          </>
        ) : null}

        {tab === "management" && !isPlayer ? (
          <>
            <OwnerManagement
              role={safeUser?.role}
              onOpenOrganizerPanel={onOpenOrganizerPanel}
              onOpenArenaPanel={onOpenArenaPanel}
              onOpenAgenda={onOpenAgenda}
              onOpenFinance={onOpenFinance}
              onOpenPromotions={onOpenPromotions}
              onOpenAccountSettings={onOpenAccountSettings}
            />
          </>
        ) : null}

        {/* Logout */}
        <div className={styles.footer}>
          <button type="button" className={styles.dangerBtn} onClick={() => onLogout?.()}>
            ⎋ Sair da conta
          </button>
        </div>
      </div>

      {/* MODAIS (mantidos) */}
      {selectedAchievement ? (
        <AchievementModal
          achievement={selectedAchievement}
          isUnlocked={(safeUser.unlockedAchievementIds || []).includes(selectedAchievement.id)}
          progress={getProgress(selectedAchievement)}
          statusLabel={getStatusLabel(selectedAchievement)}
          onClose={() => setSelectedAchievement(null)}
        />
      ) : null}

      {miniGadgetAchievement ? (
        <MiniAchievementModal achievement={miniGadgetAchievement} onClose={() => setMiniGadgetAchievement(null)} />
      ) : null}
    </div>
  );
}
