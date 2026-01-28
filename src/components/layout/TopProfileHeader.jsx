import styles from "./AppShell.module.css";

export default function TopProfileHeader({
  title = "PERFIL",
  onBack,
  showBack = true,

  // actions
  onCopyId,
  onShare,
  onToggleTheme,
  theme = "light",

  showLogout = false,
  onLogout,
}) {
  const isDark = theme === "dark";

  return (
    <div className={styles.topbarRow}>
      <button
        type="button"
        className={`${styles.backBtn} ${showBack ? styles.backShow : styles.backHide}`}
        onClick={onBack}
        aria-label="Voltar"
        title="Voltar"
      >
        ←
      </button>

      <div className={styles.topbarCenter}>
        <div className={styles.topbarTitle}>{title}</div>
      </div>

      <div className={styles.topbarActions}>
        {onCopyId ? (
          <button type="button" className={styles.headerBtn} onClick={onCopyId} title="Copiar ID">
            🆔
          </button>
        ) : null}

        {onShare ? (
          <button type="button" className={styles.headerBtn} onClick={onShare} title="Compartilhar">
            📤
          </button>
        ) : null}

        {onToggleTheme ? (
          <button
            type="button"
            className={`${styles.headerBtn} ${isDark ? styles.headerBtnActive : ""}`}
            onClick={onToggleTheme}
            title={isDark ? "Tema claro" : "Tema escuro"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        ) : null}

        {showLogout ? (
          <button type="button" className={styles.headerBtnWide} onClick={onLogout} title="Sair">
            Sair
          </button>
        ) : null}
      </div>
    </div>
  );
}
