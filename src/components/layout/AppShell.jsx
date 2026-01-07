import styles from "./AppShell.module.css";

export default function AppShell({
  title,
  showBack,
  onBack,
  active,
  onNav,
  canCreateMatch = false, // ✅ novo
  children,
}) {
  const navCount = canCreateMatch ? 5 : 4;

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button
          className={`${styles.backBtn} ${
            showBack ? styles.backShow : styles.backHide
          }`}
          onClick={onBack}
          aria-label="Voltar"
        >
          ←
        </button>

        <div className={styles.title}>{title}</div>

        <div className={styles.rightSlot} />
      </header>

      <main className={styles.content}>{children}</main>

      <nav className={styles.bottomNav} style={{ "--nav-count": navCount }}>
        <NavItem
          label="Home"
          icon="🏠"
          active={active === "home"}
          onClick={() => onNav("home")}
        />

        <NavItem
          label="Partidas"
          icon="⚽"
          active={active === "matches"}
          onClick={() => onNav("matches")}
        />

        {/* ✅ Só aparece se puder criar */}
        {canCreateMatch && (
          <NavItem
            label="Criar"
            icon="＋"
            active={active === "create"}
            onClick={() => onNav("create")}
          />
        )}

        <NavItem
          label="Perfil"
          icon="👤"
          active={active === "profile"}
          onClick={() => onNav("profile")}
        />

        <NavItem
          label="Wallet"
          icon="💳"
          active={active === "wallet"}
          onClick={() => onNav("wallet")}
        />
      </nav>
    </div>
  );
}

function NavItem({ label, icon, active, onClick }) {
  return (
    <button
      className={`${styles.navItem} ${active ? styles.navActive : ""}`}
      onClick={onClick}
      type="button"
    >
      <div className={styles.navIcon}>{icon}</div>
      <div className={styles.navLabel}>{label}</div>
    </button>
  );
}
