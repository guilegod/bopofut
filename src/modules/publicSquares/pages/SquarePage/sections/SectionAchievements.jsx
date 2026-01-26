import { useMemo } from "react";
import styles from "../SquarePage.module.css";
import { badgeClass } from "../utils/ui";
import * as AchStore from "../utils/achievementsStore.js";
import * as XpStore from "../utils/xpStore.js";

export default function SectionAchievements({ squareId, user }) {
  const list = useMemo(() => AchStore.listAllWithState(squareId, user?.id), [squareId, user?.id]);
  const stats = useMemo(() => (user?.id ? XpStore.getStats(squareId, user.id) : {}), [squareId, user?.id]);

  const unlockedCount = useMemo(() => list.filter((a) => a.unlocked).length, [list]);

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>🎖️ Conquistas</div>
        <span className={badgeClass("muted")}>
          {unlockedCount}/{list.length}
        </span>
      </div>

      {!user?.id ? (
        <div className={styles.softCard}>
          <div className={styles.title}>🔒 Login necessário</div>
          <div className={styles.hint}>Entre para desbloquear conquistas.</div>
        </div>
      ) : null}

      <div className={styles.hint} style={{ marginTop: 8 }}>
        As conquistas são por praça (por enquanto). Depois a gente conecta no Perfil global do BopôFut.
      </div>

      <div className={styles.presenceList} style={{ marginTop: 12 }}>
        {list.map((a) => (
          <div key={a.id} className={styles.presenceRow}>
            <div className={styles.presenceLeft}>
              <div className={styles.avatar}>
                <div className={styles.avatarFallback}>{a.icon}</div>
              </div>

              <div className={styles.nameBlock}>
                <div className={styles.nameRow}>
                  <div className={styles.name}>
                    {a.title}{" "}
                    {a.unlocked ? <span className={badgeClass("live")}>DESBLOQUEADA</span> : <span className={badgeClass("muted")}>BLOQUEADA</span>}
                  </div>
                </div>
                <div className={styles.sub}>{a.desc}</div>

                {/* mini progresso (MVP) */}
                {a.id === "regular_10" ? (
                  <div className={styles.sub}>Progresso: {(stats.CHECKIN || 0)}/10</div>
                ) : null}
                {a.id === "chatter_25" ? (
                  <div className={styles.sub}>Progresso: {(stats.CHAT_MSG || 0)}/25</div>
                ) : null}
                {a.id === "accepted_3" ? (
                  <div className={styles.sub}>Progresso: {(stats.CHALLENGE_ACCEPT || 0)}/3</div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
