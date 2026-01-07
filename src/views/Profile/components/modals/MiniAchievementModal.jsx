import styles from "./Modal.module.css";

export default function MiniAchievementModal({ achievement, onClose }) {
  return (
    <div className={styles.overlay}>
      <button className={styles.backdrop} onClick={onClose} aria-label="Fechar" />
      <div className={styles.modal}>
        <div className={styles.bigIcon + " " + styles.ok}>{achievement.icon}</div>
        <h3 className={styles.title}>{achievement.title}</h3>
        <p className={styles.desc}>"{achievement.description}"</p>

        <button className={styles.closeBtn} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
