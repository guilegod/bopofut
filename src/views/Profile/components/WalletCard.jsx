import styles from "./WalletCard.module.css";

export default function WalletCard({ user, onOpenWallet }) {
  const balance = Number(user?.walletBalance || 0);

  return (
    <section className={styles.card}>
      <div className={styles.left}>
        <div className={styles.label}>Wallet</div>
        <div className={styles.value}>R$ {balance.toFixed(2)}</div>
        <div className={styles.sub}>Saldo disponível</div>
      </div>

      <button type="button" className={styles.btn} onClick={onOpenWallet}>
        Abrir
      </button>
    </section>
  );
}
