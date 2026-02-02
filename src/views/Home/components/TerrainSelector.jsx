import styles from "./TerrainSelector.module.css";

const TERRAIN_OPTIONS = [
  {
    id: "fut7",
    title: "Sintético",
    sub: "Fut7 / Society",
    img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200&h=780",
    accent: "green",
    enabled: true,
  },
  {
    id: "futsal",
    title: "Salão",
    sub: "Futsal",
    img: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=1200&h=780",
    accent: "gold",
    enabled: true,
  },

  // ✅ Categorias extras (sem quebrar a lógica atual)
  // Deixa o app com cara de plataforma e você ativa quando tiver suporte no backend/front
  {
    id: "beach",
    title: "Areia",
    sub: "Beach Soccer",
    img: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&q=80&w=1200&h=780",
    accent: "sky",
    enabled: false,
    badge: "Em breve",
  },
  {
    id: "volei",
    title: "Vôlei",
    sub: "Quadra",
    img: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&q=80&w=1200&h=780",
    accent: "violet",
    enabled: false,
    badge: "Em breve",
  },
  {
    id: "basket",
    title: "Basquete",
    sub: "Quadra",
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200&h=780",
    accent: "orange",
    enabled: false,
    badge: "Em breve",
  },
  {
    id: "tenis",
    title: "Tênis",
    sub: "Quadra",
    img: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&q=80&w=1200&h=780",
    accent: "mint",
    enabled: false,
    badge: "Em breve",
  },
];

export default function TerrainSelector({ activeType, onChangeType }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid} role="tablist" aria-label="Tipos de terreno">
        {TERRAIN_OPTIONS.map((t) => {
          const isActive = activeType === t.id;
          const isDisabled = !t.enabled;

          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={isDisabled}
              onClick={() => (isDisabled ? null : onChangeType?.(t.id))}
              className={[
                styles.card,
                styles[`accent_${t.accent}`],
                isActive ? styles.active : styles.inactive,
                isDisabled ? styles.disabled : "",
              ].join(" ")}
            >
              <img src={t.img} alt={`${t.title} - ${t.sub}`} className={styles.img} loading="lazy" />

              <div className={styles.scrim} />

              <div className={styles.overlay}>
                <div className={styles.topRow}>
                  {t.badge ? (
                    <span className={styles.badge}>{t.badge}</span>
                  ) : (
                    <span className={styles.badgeGhost}>•</span>
                  )}
                </div>

                <div className={styles.text}>
                  <p className={styles.title}>{t.title}</p>
                  <p className={styles.sub}>{t.sub}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
