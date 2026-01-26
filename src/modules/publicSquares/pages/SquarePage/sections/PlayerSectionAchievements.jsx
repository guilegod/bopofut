import styles from "../SquarePage.module.css";
import { badgeClass } from "../utils/ui";
import * as AchStore from "../utils/achievementsStore.js";

export default function PlayerSectionAchievements({ squareId, userId }) {
  const list = AchStore.listAllWithState(squareId, userId);
  const unlocked = list.filter((a) => a.unlocked).length;

  return (
    <div className={styles.softCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>Conquistas</div>
        <span className={badgeClass("muted")}>{unlocked}/{list.length}</span>
      </div>

      <div className={styles.presenceList} style={{ marginTop: 10 }}>
        {list.map((a) => (
          <div key={a.id} className={styles.presenceRow}>
            <div className={styles.presenceLeft}>
              <div className={styles.avatar}>
                <div className={styles.avatarFallback}>{a.icon}</div>
              </div>

              <div className={styles.nameBlock}>
                <div className={styles.nameRow}>
                  <div className={styles.name}>{a.title}</div>
                  <span className={badgeClass(a.unlocked ? "live" : "muted")}>
                    {a.unlocked ? "DESBLOQUEADA" : "BLOQUEADA"}
                  </span>
                </div>
                <div className={styles.sub}>{a.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
