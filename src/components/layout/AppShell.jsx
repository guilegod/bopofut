import styles from "./AppShell.module.css";

export default function AppShell({
  // ✅ legacy
  title,
  showBack,
  onBack,

  // ✅ new (preferred)
  header, // ReactNode: custom header (replaces default)
  showTopBar = true,

  active,
  onNav,
  canCreateMatch = false,
  showNav = true,
  isArenaOwner = false,
  isAdmin = false, // ✅ NOVO
  children,
}) {
  // user normal: Home + (Praças?) + Partidas + (Criar?) + Perfil + Wallet
  const base = 4; // Home, Partidas, Perfil, Wallet
  const plazas = isAdmin ? 1 : 0;
  const create = canCreateMatch ? 1 : 0;

  const navCount = isArenaOwner ? 4 : base + plazas + create;

  return (
    <div className={styles.shell}>
      {showTopBar ? (
        header ? (
          <header className={`${styles.topbar} ${styles.topbarCustom}`}>{header}</header>
        ) : (
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
        )
      ) : null}

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

              {isAdmin && (
                <NavItem
                  label="Praças"
                  icon="🏞️"
                  active={active === "publicCourts"}
                  onClick={() => onNav("publicCourts")}
                />
              )}

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
                label="Carteira"
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
