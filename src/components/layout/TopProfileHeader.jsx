import { useEffect, useState } from "react";
import styles from "./AppShell.module.css";

export default function TopProfileHeader({
  title = "PERFIL",
  onBack,
  showBack = true,

  // ações rápidas (ícones)
  onCopyId,
  onShare,
  onToggleTheme,
  theme = "light",

  // logout
  showLogout = false,
  onLogout,

  // ✅ menu mobile (bottom sheet)
  // passe essas callbacks no ProfileHybrid pra controlar tudo pelo header
  onEditProfile,
  onOpenSettings,
  onOpenWallet, // opcional (se quiser, mas vc disse que pode remover por enquanto)
  hideWalletInMenu = true, // por padrão some do menu

  // extras (opcional)
  extraItems = [], // [{ label, onClick, kind?: "danger" }]
}) {
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);

  // fecha no ESC (desktop)
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
  }

  function run(fn) {
    return () => {
      close();
      fn?.();
    };
  }

  const hasMenu =
    !!onEditProfile || !!onOpenSettings || (!!onOpenWallet && !hideWalletInMenu) || (extraItems?.length || 0) > 0;

  return (
    <>
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
          {/* Desktop/Tablet: ícones continuam */}
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

          {/* ✅ Mobile: 1 botão "⋯" que abre o menu */}
          {hasMenu ? (
            <button
              type="button"
              className={styles.kebabBtn}
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              title="Menu"
            >
              ⋯
            </button>
          ) : null}

          {showLogout ? (
            <button type="button" className={styles.headerBtnWide} onClick={onLogout} title="Sair">
              Sair
            </button>
          ) : null}
        </div>
      </div>

      {/* ✅ Bottom sheet */}
      {open ? (
        <div className={styles.sheetBackdrop} role="dialog" aria-modal="true" onClick={close}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetTitle}>Opções</div>

            <div className={styles.sheetList}>
              {onEditProfile ? (
                <button type="button" className={styles.sheetItem} onClick={run(onEditProfile)}>
                  ✏️ Editar perfil
                </button>
              ) : null}

              {onOpenSettings ? (
                <button type="button" className={styles.sheetItem} onClick={run(onOpenSettings)}>
                  ⚙️ Configurações
                </button>
              ) : null}

              {/* Wallet opcional */}
              {onOpenWallet && !hideWalletInMenu ? (
                <button type="button" className={styles.sheetItem} onClick={run(onOpenWallet)}>
                  💳 Wallet
                </button>
              ) : null}

              {(onCopyId || onShare) ? <div className={styles.sheetDivider} /> : null}

              {onCopyId ? (
                <button type="button" className={styles.sheetItem} onClick={run(onCopyId)}>
                  🆔 Copiar ID
                </button>
              ) : null}

              {onShare ? (
                <button type="button" className={styles.sheetItem} onClick={run(onShare)}>
                  📤 Copiar @/ID
                </button>
              ) : null}

              {extraItems?.length ? <div className={styles.sheetDivider} /> : null}

              {extraItems?.map((it, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={it.kind === "danger" ? styles.sheetItemDanger : styles.sheetItem}
                  onClick={run(it.onClick)}
                >
                  {it.label}
                </button>
              ))}

              {showLogout ? <div className={styles.sheetDivider} /> : null}

              {showLogout ? (
                <button type="button" className={styles.sheetItemDanger} onClick={run(onLogout)}>
                  🚪 Sair
                </button>
              ) : null}
            </div>

            <button type="button" className={styles.sheetClose} onClick={close}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
