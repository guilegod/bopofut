import styles from "./RankingBanner.module.css";

export default function RankingBanner({ onOpenRanking }) {
  return (
    <section className={styles.banner}>
      <div className={styles.content}>
        <h2 className={styles.h2}>Ranking The Best</h2>
        <p className={styles.p}>
          Confira quem está brocando em toda a Bópô Fut.
        </p>

        <button
          type="button"
          className={styles.btn}
          onClick={onOpenRanking}
        >
          Visualizar Tabela
        </button>
      </div>

      <div className={styles.icon} aria-hidden="true">
        ★
      </div>
    </section>
  );
}
