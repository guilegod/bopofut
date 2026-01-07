import styles from "../myMatches.module.css";

function statusKey(s) {
  return String(s || "SCHEDULED").toUpperCase();
}

function statusLabel(s) {
  const k = statusKey(s);
  if (k === "STARTED") return "Em andamento";
  if (k === "FINISHED") return "Finalizada";
  if (k === "CANCELLED") return "Cancelada";
  return "Agendada";
}

function minutesBetween(a, b) {
  if (!a || !b) return null;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / 60000));
}

function totalGoals(stats = {}) {
  return Object.values(stats).reduce(
    (sum, p) => sum + Number(p?.goals || 0),
    0
  );
}

function totalCards(discipline = {}) {
  let y = 0;
  let r = 0;
  for (const d of Object.values(discipline)) {
    y += Number(d?.yellow || 0);
    r += Number(d?.red || 0);
  }
  return { y, r };
}

export default function MatchCard({ match, court, onClick }) {
  const title = match?.title?.trim?.() || court?.name || "Partida";

  const k = statusKey(match?.admin?.status);
  const label = statusLabel(match?.admin?.status);

  const played =
    k === "FINISHED"
      ? minutesBetween(match?.admin?.startedAt, match?.admin?.endedAt)
      : null;

  const goals = totalGoals(match?.playerStats);
  const cards = totalCards(match?.discipline);
  const hasHighlight = Boolean(match?.highlights?.length);

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={onClick}
    >
      <div className={styles.imageBox}>
        <img src={court?.imageUrl} alt={court?.name || "Quadra"} />

        {/* STATUS */}
        <span className={`${styles.badge} ${styles[`badge_${k}`]}`}>
          {label}
        </span>

        <span className={styles.time}>{match?.time || "--:--"}</span>
      </div>

      <div className={styles.info}>
        <div>
          <h3>{title}</h3>
          <p>
            📍 {court?.name || "Quadra"} • 📅 {match?.date || "-"} •{" "}
            {match?.type || "-"}
          </p>

          {k === "FINISHED" && (
            <div className={styles.metaRow}>
              <span>⚽ {goals} gols</span>
              <span>🟨 {cards.y}</span>
              <span>🟥 {cards.r}</span>
              {played != null && <span>⏱️ {played} min</span>}
              {hasHighlight && <span>⭐ Destaque</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
