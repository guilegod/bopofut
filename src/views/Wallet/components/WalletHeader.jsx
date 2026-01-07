import styles from "../wallet.module.css";

export default function WalletHeader({ onBack }) {
  return (
    <header className={styles.header}>
      <button onClick={onBack} className={styles.backBtn}>←</button>
      <h2>Minha Carteira</h2>
    </header>
  );
}
