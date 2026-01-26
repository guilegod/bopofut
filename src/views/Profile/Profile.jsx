import { useMemo, useState } from "react";
import styles from "./Profile.module.css";
import { achievements } from "../../mockData.js";

import PlayerCard from "./components/Playercard.jsx";
import WalletCard from "./components/WalletCard.jsx";
import AchievementsGrid from "./components/AchievementsGrid.jsx";
import OwnerManagement from "./components/OwnerManagement.jsx";

import AchievementModal from "./components/modals/AchievementModal.jsx";
import MiniAchievementModal from "./components/modals/MiniAchievementModal.jsx";

export default function Profile({
  user,
  matches,
  courts,
  onOpenWallet,
  onEditProfile,
  onBack,
  onLogout,

  // ✅ navegação
  onOpenOrganizerPanel,
  onOpenArenaPanel,
  onOpenAgenda,
  onOpenFinance,
  onOpenPromotions,
  onOpenAccountSettings,
}) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [miniGadgetAchievement, setMiniGadgetAchievement] = useState(null);

  // ✅ roles (sem confusão)
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
        return (targetUser.unlockedAchievementIds || []).includes(achievement.id)
          ? "Concluído"
          : "Em andamento";
    }
  }

  return (
    <div className={styles.page}>
      {/* topo */}
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => onBack?.()}
          aria-label="Voltar"
        >
          ←
        </button>

        <div className={styles.topTitle}>
          Perfil <span style={{ opacity: 0.7, fontWeight: 800 }}>• {roleLabel}</span>
        </div>

        <div className={styles.topSpacer} />
      </div>

      {/* Player Card / Role Card */}
      <PlayerCard
        user={safeUser}
        role={safeUser?.role}
        achievements={achievements}
        onMiniAchievement={setMiniGadgetAchievement}
      />

      {/* Ações rápidas */}
        <button type="button" onClick={() => onEditProfile?.()} className={styles.editBtn}>
          {isArenaOwner ? "🏟️ " : "✎ "}
          <span>{isArenaOwner ? "Configurar Arena" : "Editar Perfil"}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAccountSettings?.()}
          className={styles.editBtn}
          style={{ opacity: onOpenAccountSettings ? 1 : 0.85 }}
          title={onOpenAccountSettings ? "Minha Conta (Acesso)" : "Em breve"}
        >
          👤 <span>Minha Conta (Acesso)</span>
        </button>


      {/* Carteira */}
      <WalletCard user={safeUser} onOpenWallet={() => onOpenWallet?.()} />

      {/* Conteúdo por role */}
      {isPlayer ? (
        <>
          <AchievementsGrid
            user={safeUser}
            achievements={achievements}
            onSelectAchievement={setSelectedAchievement}
          />

          <section className={styles.section}>
            <h3 className={styles.h3}>Últimas Atividades</h3>

            <div className={styles.activityList}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.activityItem}>
                  <div>
                    <div className={styles.activityTitle}>Partida recente</div>
                    <div className={styles.activitySub}>Há {i} dias</div>
                  </div>

                  <div className={styles.activityBadge}>FINALIZADO</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* ✅ nada de comentário dentro das props */}
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
      )}

      {/* Logout */}
      <button type="button" onClick={() => onLogout?.()} className={styles.editBtn}>
        ⎋ <span>Sair da Conta</span>
      </button>

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
