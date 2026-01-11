import styles from "./RankingBanner.module.css";

export default function RankingBanner({ onOpenRanking }) {
  return (
    <section className={styles.banner}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.content}>
        <span className={styles.kicker}>DESTAQUE</span>
        <h2 className={styles.title}>Ranking The Best</h2>
        <p className={styles.subtitle}>
          Confira quem está brocando em toda a Bópô Fut e suba no topo da tabela.
        </p>
      </div>

      <button type="button" className={styles.cta} onClick={onOpenRanking}>
        Visualizar Tabela →
      </button>

      <div className={styles.icon} aria-hidden="true">★</div>
    </section>
  );
}
