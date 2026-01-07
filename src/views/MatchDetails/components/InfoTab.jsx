import styles from "../MatchDetails.module.css";

export default function InfoTab({
  match,
  court,
  placeName,
  placeAddress,
  mapEmbedUrl,
  onOpenMaps,
}) {
  // prioridade do LINK (abrir no Maps):
  const mapsLink =
    match?.googleMapsUrl ||
    court?.googleMapsUrl ||
    (placeAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${placeName || ""} ${placeAddress}`.trim()
        )}`
      : null);

  const address = match?.address || court?.address || "";

  // iframe: sempre estável (gerado pelo endereço/nome)
  const iframeSrc =
    mapEmbedUrl ||
    (address
      ? `https://maps.google.com/maps?q=${encodeURIComponent(
          `${placeName || ""} ${address}`.trim()
        )}&z=15&output=embed`
      : null);

  if (!iframeSrc && !mapsLink) {
    return (
      <div className={styles.panel}>
        <p className={styles.muted}>Local ainda não informado pelo organizador.</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.h3}>
        {court?.name || match?.title || "Local da partida"}
      </h3>

      {address && <p className={styles.sub}>📍 {address}</p>}

      {iframeSrc && (
        <div className={styles.mapWrapper}>
          <iframe
            title="Mapa da Partida"
            src={iframeSrc}
            width="100%"
            height="320"
            style={{ border: 0, borderRadius: 14 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      <button
        type="button"
        className={styles.btnPrimary}
        style={{ marginTop: 12 }}
        onClick={onOpenMaps}
        disabled={!mapsLink && !address}
      >
        Ver no Google Maps
      </button>
    </div>
  );
}
