import { useMemo, useState } from "react";
import styles from "../SquarePage.module.css";
import PlayerTabs from "./PlayerTabs.jsx";

import PlayerSectionOverview from "../sections/PlayerSectionOverview.jsx";
import PlayerSectionAchievements from "../sections/PlayerSectionAchievements.jsx";
import PlayerSectionTeams from "../sections/PlayerSectionTeams.jsx";

import * as XpStore from "../utils/xpStore.js";

export default function PlayerProfileModal({ open, onClose, squareId, userId, teams = [] }) {
  const [tab, setTab] = useState("overview");

  const player = useMemo(() => {
    if (!squareId || !userId) return null;
    // pega do ranking/xp store
    const board = XpStore.getLeaderboard(squareId, { limit: 200 });
    const found = board.find((p) => p.userId === userId) || null;

    // se não tiver xp ainda, cria fallback
    return (
      found || {
        userId,
        name: "Jogador",
        avatar: "",
        xp: 0,
        level: 1,
      }
    );
  }, [squareId, userId]);

  const rank = useMemo(() => {
    if (!squareId || !userId) return null;
    return XpStore.getRankOfUser(squareId, userId);
  }, [squareId, userId]);

  const tabs = useMemo(
    () => [
      { key: "overview", label: "👤 Resumo" },
      { key: "achievements", label: "🎖️ Conquistas" },
      { key: "teams", label: "🛡️ Times" },
    ],
    []
  );

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalTop}>
          <div className={styles.title}>Perfil do Jogador</div>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
            ✕
          </button>
        </div>

        <PlayerTabs tabs={tabs} tab={tab} setTab={setTab} />

        <div className={styles.modalBody}>
          {tab === "overview" ? <PlayerSectionOverview player={player} rank={rank} /> : null}
          {tab === "achievements" ? <PlayerSectionAchievements squareId={squareId} userId={userId} /> : null}
          {tab === "teams" ? <PlayerSectionTeams teams={teams} userId={userId} /> : null}
        </div>
      </div>
    </div>
  );
}
