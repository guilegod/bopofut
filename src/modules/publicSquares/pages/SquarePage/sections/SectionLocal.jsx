import styles from "../SquarePage.module.css";
import { badgeClass, btnClass, toastCopy } from "../utils/ui";

export default function SectionLocal({ court, maps, mapsMeta, deepLink }) {
  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>📍 Local</div>
        <span className={badgeClass(mapsMeta.hasCoords ? "info" : "warn")}>
          {mapsMeta.hasCoords ? "Mapa por coords" : "Mapa por endereço"}
        </span>
      </div>

      <div className={styles.softCard}>
        <div className={styles.muted}>Endereço da praça</div>
        <div className={styles.title}>{court.address || "—"}</div>
        {court.city ? <div className={styles.hint}>{court.city}</div> : null}

        <div className={styles.mapFrame}>
          {maps.embed ? (
            <iframe
              title="Mapa da praça"
              src={maps.embed}
              width="100%"
              height="260"
              style={{ border: 0, display: "block" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className={styles.hint}>Não foi possível montar o mapa (faltou endereço/coords).</div>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={btnClass("primary")} onClick={() => window.open(maps.open, "_blank")}>
            🗺️ Ver no Google Maps
          </button>
          <button type="button" className={btnClass("ghost")} onClick={() => toastCopy(deepLink, "Link copiado ✅")}>
            🔗 Copiar link
          </button>
        </div>

        <div className={styles.hint}>
          Link gerado por: <b>{mapsMeta.hasCoords ? "COORDENADAS" : "ENDEREÇO"}</b>
        </div>
      </div>
    </div>
  );
}
