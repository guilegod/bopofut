import styles from "./AchievementsGrid.module.css";

export default function AchievementsGrid({ user, achievements, onSelectAchievement }) {
  const unlocked = user?.unlockedAchievementIds || [];

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h3 className={styles.title}>Álbum de Conquistas</h3>
        <div className={styles.count}>
          {unlocked.length} de {achievements.length}
        </div>
      </div>

      <div className={styles.grid}>
        {achievements.map((a) => {
          const ok = unlocked.includes(a.id);
          return (
            <button
              key={a.id}
              className={`${styles.item} ${ok ? styles.ok : styles.locked}`}
              onClick={() => onSelectAchievement(a)}
              title={a.title}
            >
              <div className={styles.icon}>{a.icon}</div>
              <div className={styles.label}>{a.title}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
