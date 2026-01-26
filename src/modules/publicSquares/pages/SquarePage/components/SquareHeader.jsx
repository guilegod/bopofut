import styles from "../SquarePage.module.css";
import { badgeClass, btnClass, toastCopy } from "../utils/ui";

function sportEmoji(s) {
  const k = String(s || "").toLowerCase();
  if (k.includes("vôlei") || k.includes("volei")) return "🏐";
  if (k.includes("basquete")) return "🏀";
  if (k.includes("futsal") || k.includes("fut")) return "⚽";
  if (k.includes("skate")) return "🛹";
  if (k.includes("tênis") || k.includes("tenis")) return "🎾";
  return "🏅";
}

export default function SquareHeader({
  court,
  isLive,
  presenceCount,
  deepLink,
  onBack,
  notificationsCount = 0,
  onOpenNotifications,
  myXp, // { level, xp }
}) {
  const city = court?.city || "—";
  const sports = court?.sports || [];

  return (
    <div className={styles.headerWrap}>
      {/* Linha 1 — ações */}
      <div className={styles.headerRow}>
        <button type="button" className={btnClass("ghost")} onClick={onBack}>
          ← Voltar
        </button>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={btnClass(notificationsCount > 0 ? "primary" : "soft")}
            onClick={() => onOpenNotifications?.()}
            title="Notificações da praça"
          >
            🔔 {notificationsCount}
          </button>

          <button
            type="button"
            className={btnClass("soft")}
            onClick={() => toastCopy(deepLink, "Link copiado ✅")}
            title="Copiar link da praça"
          >
            🔗 Copiar link
          </button>
        </div>
      </div>

      {/* Linha 2 — HERO */}
      <div className={styles.heroRow}>
        <div className={styles.heroLeft}>
          <div className={styles.heroTitle}>{court?.name || "Praça"}</div>

          <div className={styles.heroMeta}>
            <span className={badgeClass("muted")}>📍 {city}</span>

            <span className={badgeClass(isLive ? "live" : "muted")}>
              {isLive ? `🟢 ${presenceCount} agora` : "⚪ offline"}
            </span>

            {myXp ? (
              <span className={badgeClass("info")}>
                🏆 LVL {myXp.level} • {myXp.xp} XP
              </span>
            ) : null}
          </div>

          {/* Modalidades compactas */}
          {sports.length ? (
            <div className={styles.sportsRow}>
              {sports.map((s) => (
                <span key={s} className={styles.sportChip}>
                  {sportEmoji(s)} {s}
                </span>
              ))}
            </div>
          ) : (
            <div className={styles.sportsRow}>
              <span className={styles.sportChip}>🏟️ Sem modalidades cadastradas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
