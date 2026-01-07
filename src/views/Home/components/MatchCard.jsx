import styles from "./MatchCard.module.css";

function getStatusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "iniciada" || s === "started" || s === "live") return "Em andamento";
  if (s === "finalizada" || s === "finished") return "Finalizada";
  if (s === "cancelada" || s === "cancelled") return "Cancelada";
  return "Agendada";
}

function getStatusKey(status) {
  const s = String(status || "").toLowerCase();
  if (s === "iniciada" || s === "started" || s === "live") return "live";
  if (s === "finalizada" || s === "finished") return "finished";
  if (s === "cancelada" || s === "cancelled") return "cancelled";
  return "scheduled";
}

export default function MatchCard({ match, court, onClick }) {
  const maxPlayers = Number(match?.maxPlayers || 0);
  const currentPlayers = Array.isArray(match?.currentPlayers)
    ? match.currentPlayers
    : [];

  const spotsLeft = Math.max(0, maxPlayers - currentPlayers.length);

  const type = String(match?.type || "").toLowerCase();
  const typeLabel = match?.type || "-";
  const price = match?.pricePerPlayer ?? match?.price ?? 0;

  const matchTitle = match?.title?.trim?.() ? match.title : null;

  // ✅ STATUS backend-ready
  const status = match?.admin?.status;
  const statusLabel = getStatusLabel(status);
  const statusKey = getStatusKey(status);

  function handleKeyDown(e) {
    if (e.key === "Enter") onClick?.();
  }

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`Partida: ${matchTitle || court?.name || "Quadra"}`}
    >
      <div className={styles.media}>
        <img
          src={
            court?.imageUrl ||
            "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&q=80&w=900&h=520"
          }
          alt={court?.name || "Quadra"}
          className={styles.img}
        />

        {match?.distance != null && (
          <div className={styles.distance}>
            📍 {Number(match.distance).toFixed(1)} km
          </div>
        )}

        {/* ✅ STATUS BADGE */}
        <div
          className={`${styles.status} ${styles[`status_${statusKey}`]}`}
        >
          {statusLabel}
        </div>

        <div
          className={`${styles.typeBadge} ${
            type === "fut7" ? styles.typeGreen : styles.typeGold
          }`}
        >
          {typeLabel} • {type === "fut7" ? "Sintético" : "Salão"}
        </div>

        <div className={styles.price}>R$ {price},00</div>
      </div>

      <div className={styles.body}>
        <div>
          <h3 className={styles.title}>
            {matchTitle || court?.name || "Quadra"}
          </h3>

          <p className={styles.sub}>
            {matchTitle ? `📍 ${court?.name || "Quadra"} • ` : "📅 "}
            {match?.date || "-"} • {match?.time || "-"}
          </p>
        </div>

        <div className={styles.right}>
          <p
            className={`${styles.spots} ${
              spotsLeft <= 2 ? styles.spotsDanger : styles.spotsOk
            }`}
          >
            {spotsLeft === 0
              ? "Lotado"
              : spotsLeft === 1
              ? "Última vaga!"
              : `${spotsLeft} vagas`}
          </p>

          <div className={styles.dots}>
            {Array.from({ length: maxPlayers }).map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${
                  i < currentPlayers.length ? styles.dotOn : styles.dotOff
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
