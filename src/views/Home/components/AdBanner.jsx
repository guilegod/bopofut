import { ArrowRight, Sparkles } from "lucide-react";
import styles from "./AdBanner.module.css";

export default function AdBanner({
  title = "Vire o dono da quadra",
  subtitle = "Gerencie horários, pagamentos, ranking e reservas em tempo real no BóPô Fut.",
  ctaText = "Quero saber mais",
  onClick,
  imageUrl = "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80",
}) {
  return (
    <section className={styles.banner} aria-label="Banner publicitário premium">
      <div
        className={styles.bg}
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-hidden="true"
      />

      <div className={styles.gradient} />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.textBlock}>
          <span className={styles.kicker}>
            <Sparkles size={14} />
            PATROCINADO
          </span>

          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <button
          type="button"
          className={styles.cta}
          onClick={() => onClick?.()}
        >
          <span>{ctaText}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
