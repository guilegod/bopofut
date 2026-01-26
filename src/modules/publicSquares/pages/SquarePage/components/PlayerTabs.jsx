import styles from "../SquarePage.module.css";

export default function PlayerTabs({ tabs, tab, setTab }) {
  return (
    <div className={styles.playerTabs}>
      {tabs.map((t) => {
        const active = tab === t.key;
        const cls = active
          ? `${styles.btn} ${styles.menuBtn} ${styles.menuBtnActive}`
          : `${styles.btn} ${styles.btnGhost} ${styles.menuBtn}`;

        return (
          <button key={t.key} type="button" className={cls} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
