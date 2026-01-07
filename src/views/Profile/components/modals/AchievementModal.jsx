import styles from "./Modal.module.css";

export default function AchievementModal({ achievement, isUnlocked, progress, statusLabel, onClose }) {
  return (
    <div className={styles.overlay}>
      <button className={styles.backdrop} onClick={onClose} aria-label="Fechar" />
      <div className={styles.modal}>
        <div className={`${styles.bigIcon} ${isUnlocked ? styles.ok : styles.locked}`}>
          {achievement.icon}
        </div>

        <h3 className={styles.title}>{achievement.title}</h3>
        <p className={styles.desc}>{achievement.description}</p>

        <div className={styles.box}>
          <div className={styles.row}>
            <span className={styles.label}>Missão</span>
            <span className={styles.value}>{achievement.objective}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Progresso</span>
            <span className={styles.value}>{statusLabel}</span>
          </div>

          <div className={styles.progressOuter}>
            <div className={styles.progressInner} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
