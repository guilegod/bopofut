import styles from "../wallet.module.css";

export default function BalanceCard({ balance }) {
  return (
    <section className={styles.balanceCard}>
      <p className={styles.balanceLabel}>Seus Bópô Créditos</p>
      <h2 className={styles.balanceValue}>
        R$ {balance.toFixed(2)}
      </h2>

      <button className={styles.secondaryBtn}>
        Ver Extrato
      </button>
    </section>
  );
}
