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

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=60";

export default function Header({ court, match, onBack, placeName, placeAddress }) {
  const typeLabel = String(match?.type || "").replace(/_/g, " ").toUpperCase();

  const status = match?.admin?.status;
  const statusLabel = getStatusLabel(status);
  const statusKey = getStatusKey(status);

  const imgSrc = court?.imageUrl || match?.imageUrl || FALLBACK_IMG;
  const courtName = court?.name || match?.title || "Local da Partida";
  const address = placeAddress || court?.address || match?.matchAddress || "Local a confirmar";

  return (
    <div className={styles.header}>
      <img src={imgSrc} alt={courtName} className={styles.img} />
      <div className={styles.overlay} />

      <button onClick={onBack} className={styles.backBtn} aria-label="Voltar">
        ←
      </button>

      <div className={styles.info}>
        <div className={styles.badges}>
          <span className={styles.type}>{typeLabel}</span>

          <span className={`${styles.status} ${styles[`status_${statusKey}`]}`}>
            {statusLabel}
          </span>

          {match?.distance !== undefined && match?.distance !== null && (
            <span className={styles.distance}>📍 {Number(match.distance).toFixed(1)} km</span>
          )}
        </div>

        <h2 className={styles.title}>{placeName || courtName}</h2>
        <p className={styles.address}>{address}</p>
      </div>
    </div>
  );
}
