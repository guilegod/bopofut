import styles from "../SquarePage.module.css";
import { badgeClass } from "../utils/ui";

export default function PlayerSectionTeams({ teams = [], userId }) {
  const mine = (teams || []).filter((t) => (t.members || []).some((m) => m.userId === userId));

  return (
    <div className={styles.softCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>Times</div>
        <span className={badgeClass("muted")}>{mine.length}</span>
      </div>

      {mine.length === 0 ? (
        <div className={styles.hint} style={{ marginTop: 10 }}>
          Esse jogador ainda não está em nenhum time (nesta praça).
        </div>
      ) : (
        <div className={styles.presenceList} style={{ marginTop: 10 }}>
          {mine.map((t) => (
            <div key={t.id} className={styles.presenceRow}>
              <div className={styles.presenceLeft}>
                <div className={styles.avatar}>
                  {t.badgeUrl ? <img src={t.badgeUrl} alt="" /> : <div className={styles.avatarFallback}>🛡️</div>}
                </div>

                <div className={styles.nameBlock}>
                  <div className={styles.nameRow}>
                    <div className={styles.name}>{t.name}</div>
                    <span className={badgeClass("info")}>{t.sport || "—"}</span>
                  </div>
                  <div className={styles.sub}>{(t.members || []).length} membros</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
