import styles from "./MatchCard.module.css";

function statusKey(s) {
  return String(s || "SCHEDULED").toUpperCase().trim();
}

function statusLabelFromBackend(s) {
  const k = statusKey(s);
  if (k === "LIVE") return "Ao vivo";
  if (k === "FINISHED") return "Finalizada";
  if (k === "EXPIRED") return "Expirada";
  if (k === "CANCELED" || k === "CANCELLED") return "Cancelada";
  return "Agendada";
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function typeLabel(t) {
  const k = String(t || "").toUpperCase().trim();
  if (k === "FUT7") return "Fut7 (Sintético)";
  if (k === "FUTSAL") return "Futsal";
  if (k === "VOLEI") return "Vôlei";
  if (k === "BASQUETE") return "Basquete";
  if (k === "TENIS") return "Tênis";
  return k ? k : "—";
}

function PresencePill({ presenceLabel }) {
  if (!presenceLabel) return null;

  const tone = presenceLabel.tone; // ok | warn | neutral
  const bg =
    tone === "ok"
      ? "rgba(34,197,94,0.18)"
      : tone === "warn"
      ? "rgba(245,158,11,0.18)"
      : "rgba(255,255,255,0.10)";

  const border =
    tone === "ok"
      ? "rgba(34,197,94,0.35)"
      : tone === "warn"
      ? "rgba(245,158,11,0.35)"
      : "rgba(255,255,255,0.16)";

  return (
    <span
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        fontWeight: 1000,
        fontSize: 12,
        backdropFilter: "blur(10px)",
      }}
    >
      {presenceLabel.text}
    </span>
  );
}

export default function MatchCard({ match, court, onClick, presenceLabel, locationText }) {
  const title = match?.title?.trim?.() || "Partida";

  const k = statusKey(match?.status);
  const label = statusLabelFromBackend(match?.status);

  const courtName =
    court?.displayName ||
    court?.uiName ||
    court?.name ||
    match?.court?.displayName ||
    match?.court?.name ||
    "Arena";

  const when = formatDateTime(match?.date);
  const type = typeLabel(match?.type);
  const loc = locationText || "Endereço não informado";

  const hasImage = Boolean(court?.imageUrl);

  return (
    <div className={styles.card} role="button" tabIndex={0} onClick={onClick}>
      <div className={styles.imageBox} style={{ position: "relative" }}>
        {hasImage ? (
          <img src={court.imageUrl} alt={courtName} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              fontWeight: 1000,
              letterSpacing: 0.2,
            }}
          >
            🏟️ {courtName}
          </div>
        )}

        <span className={`${styles.badge} ${styles[`badge_${k}`]}`}>{label}</span>

        {/* se você ainda tiver match.time no front antigo, mantém, mas mostra fallback */}
        <span className={styles.time}>{match?.time || "--:--"}</span>

        <PresencePill presenceLabel={presenceLabel} />
      </div>

      <div className={styles.info}>
        <div>
          <h3>{title}</h3>

          <p>📍 {courtName} • 🗺️ {loc}</p>

          <p>📅 {when} • {type}</p>

          {/* 💸 preço por atleta */}
          <p style={{ opacity: 0.9, fontWeight: 900 }}>
            💸{" "}
            {match?.pricePerPlayer !== undefined && match?.pricePerPlayer !== null
              ? `R$ ${Number(match.pricePerPlayer)}`
              : "Preço a confirmar"}
            {" / atleta"}
          </p>
        </div>
      </div>
    </div>
  );
}
