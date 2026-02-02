// AdBanner.jsx
import styles from "./AdBanner.module.css";

export default function AdBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.tag}>Patrocinado</span>

        <h2 className={styles.title}>
          Vire o dono da quadra
        </h2>

        <p className={styles.subtitle}>
          Gerencie horários, pagamentos e reservas em tempo real no BóPô Fut.
        </p>

        <button className={styles.cta}>
          Quero saber mais <span>→</span>
        </button>
      </div>

      {/* detalhe visual, não imagem pesada */}
      <div className={styles.glow} />
    </div>
  );
}
