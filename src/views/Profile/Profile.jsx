import { useMemo, useState } from "react";
import styles from "./Profile.module.css";
import { achievements } from "../../mockData.js";

import PlayerCard from "./components/PlayerCard.jsx";
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
  onLogout, // ✅ novo
}) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [miniGadgetAchievement, setMiniGadgetAchievement] = useState(null);

  const isOwner = user?.role === "owner";

  function getProgress(achievement, targetUser = user) {
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
        return (targetUser.unlockedAchievementIds || []).includes(achievement.id)
          ? 100
          : 30;
    }
  }

  function getStatusLabel(achievement, targetUser = user) {
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
        <button className={styles.backBtn} onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <div className={styles.topTitle}>Perfil</div>
        <div className={styles.topSpacer} />
      </div>

      {/* Player Card */}
      <PlayerCard
        user={user}
        isOwner={isOwner}
        achievements={achievements}
        onMiniAchievement={setMiniGadgetAchievement}
      />

      {/* Editar perfil */}
      <button onClick={onEditProfile} className={styles.editBtn}>
        ✎ <span>Editar Perfil</span>
      </button>

      {/* Carteira */}
      <WalletCard user={user} onOpenWallet={onOpenWallet} />

      {/* Conteúdo por role */}
      {!isOwner ? (
        <>
          <AchievementsGrid
            user={user}
            achievements={achievements}
            onSelectAchievement={setSelectedAchievement}
          />

          <section className={styles.section}>
            <h3 className={styles.h3}>Últimas Atividades</h3>

            <div className={styles.activityList}>
              {/* TEMPORÁRIO até backend */}
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
        <OwnerManagement />
      )}

      {/* Logout */}
      <button onClick={onLogout} className={styles.editBtn}>
        ⎋ <span>Sair da Conta</span>
      </button>

      {/* MODAIS */}
      {selectedAchievement && (
        <AchievementModal
          achievement={selectedAchievement}
          isUnlocked={(user.unlockedAchievementIds || []).includes(
            selectedAchievement.id
          )}
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
