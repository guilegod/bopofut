import styles from "../ranking.module.css";

export default function Header({ onBack }) {
  return (
    <header className={styles.header}>
      <button onClick={onBack} className={styles.back}>←</button>
      <h2>Tabela Bópô</h2>
    </header>
  );
}
