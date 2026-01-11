import styles from "./AppShell.module.css";

export default function AppShell({
  title,
  showBack,
  onBack,
  active,
  onNav,
  canCreateMatch = false,
  showNav = true,
  isArenaOwner = false, // ✅ NOVO
  children,
}) {
  const navCount = isArenaOwner ? 4 : canCreateMatch ? 5 : 4;

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button
          className={`${styles.backBtn} ${showBack ? styles.backShow : styles.backHide}`}
          onClick={onBack}
          aria-label="Voltar"
          type="button"
        >
          ←
        </button>

        <div className={styles.title}>{title}</div>
        <div className={styles.rightSlot} />
      </header>

      <main className={styles.content}>{children}</main>

      {showNav ? (
        <nav className={styles.bottomNav} style={{ "--nav-count": navCount }}>
          {isArenaOwner ? (
            <>
              <NavItem
                label="Arena"
                icon="🏟️"
                active={active === "arenaPanel"}
                onClick={() => onNav("arenaPanel")}
              />
              <NavItem
                label="Agenda"
                icon="🗓️"
                active={active === "arenaAgenda"}
                onClick={() => onNav("arenaAgenda")}
              />
              <NavItem
                label="Financeiro"
                icon="💰"
                active={active === "arenaFinance"}
                onClick={() => onNav("arenaFinance")}
              />
              <NavItem
                label="Perfil"
                icon="👤"
                active={active === "profile"}
                onClick={() => onNav("profile")}
              />
            </>
          ) : (
            <>
              <NavItem
                label="Home"
                icon="🏠"
                active={active === "home"}
                onClick={() => onNav("home")}
              />

              <NavItem
                label="Partidas"
                icon="⚽"
                active={active === "myMatches"}
                onClick={() => onNav("matches")}
              />

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
            </>
          )}
        </nav>
      ) : null}
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
