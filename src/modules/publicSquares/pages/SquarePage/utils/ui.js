import styles from "../SquarePage.module.css";

export function badgeClass(kind) {
  const base = styles.badge;
  if (kind === "live") return `${base} ${styles.badgeLive}`;
  if (kind === "warn") return `${base} ${styles.badgeWarn}`;
  if (kind === "info") return `${base} ${styles.badgeInfo}`;
  return base;
}

export function btnClass(kind) {
  const base = styles.btn;
  if (kind === "primary") return `${base} ${styles.btnPrimary}`;
  if (kind === "danger") return `${base} ${styles.btnDanger}`;
  if (kind === "ghost") return `${base} ${styles.btnGhost}`;
  if (kind === "soft") return `${base} ${styles.btnSoft}`;
  return base;
}

export function toastCopy(text, okMsg = "Copiado ✅") {
  const value = String(text || "");
  try {
    navigator.clipboard?.writeText(value);
    alert(okMsg);
  } catch {
    alert("Não consegui copiar automaticamente 😬 (selecione e copie manualmente)");
  }
}
