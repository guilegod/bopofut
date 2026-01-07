import styles from "../friends.module.css";

export default function Header({ onBack }) {
  return (
    <div className={styles.header}>
      <button onClick={onBack} className={styles.backBtn}>←</button>
      <h2>Seu Elenco</h2>
    </div>
  );
}
