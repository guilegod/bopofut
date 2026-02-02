// ArenaCard.jsx
import styles from "./ArenaCard.module.css";

export default function ArenaCard({ arena, onClick }) {
  const {
    name,
    city,
    address,
    courtsCount,
    modalities = [],
    todayLabel = "Hoje",
    timeRange,
    logoUrl, // 👈 logo da arena (ou imageUrl)
  } = arena;

  return (
    <button
      className={styles.card}
      onClick={onClick}
      style={
        logoUrl
          ? { backgroundImage: `url(${logoUrl})` }
          : undefined
      }
    >
      {/* Overlay pra leitura */}
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>🏟 {name}</h3>
            <p className={styles.location}>
              📍 {city} {address ? `• ${address}` : ""}
            </p>
          </div>

          <span className={styles.arrow}>→</span>
        </div>

        <div className={styles.meta}>
          <span>🥅 {courtsCount} quadras</span>
          <span className={styles.badge}>📅 {todayLabel}</span>
        </div>

        <div className={styles.chips}>
          {modalities.map((m) => (
            <span key={m} className={styles.chip}>
              {m}
            </span>
          ))}
        </div>

        <div className={styles.footer}>
          <span className={styles.time}>
            ⏰ {timeRange || "Sem horários configurados"}
          </span>

          <span className={styles.cta}>Ver horários →</span>
        </div>
      </div>
    </button>
  );
}
