import styles from "./Header.module.css";

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

export default function Header({ court, match, onBack, placeName, placeAddress }) {
  const typeLabel = String(match?.type || "")
    .replace(/_/g, " ")
    .toUpperCase();

  // ✅ status vem do admin (backend-ready)
  const status = match?.admin?.status;
  const statusLabel = getStatusLabel(status);
  const statusKey = getStatusKey(status);

  return (
    <div className={styles.header}>
      <img src={court.imageUrl} alt={court.name} className={styles.img} />
      <div className={styles.overlay} />

      <button onClick={onBack} className={styles.backBtn} aria-label="Voltar">
        ←
      </button>

      <div className={styles.info}>
        <div className={styles.badges}>
          <span className={styles.type}>{typeLabel}</span>

          {/* ✅ Status badge */}
          <span className={`${styles.status} ${styles[`status_${statusKey}`]}`}>
            {statusLabel}
          </span>

          {match.distance !== undefined && match.distance !== null && (
            <span className={styles.distance}>📍 {Number(match.distance).toFixed(1)} km</span>
          )}
        </div>

        <h2 className={styles.title}>{placeName || court.name}</h2>
        <p className={styles.address}>{placeAddress || court.address}</p>
      </div>
    </div>
  );
}
