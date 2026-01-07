import styles from "../ranking.module.css";

export default function Legend() {
  return (
    <div className={styles.legend}>
      <p><strong>J</strong> Jogos</p>
      <p><strong>G</strong> Gols</p>
      <p><strong>A</strong> Assistências</p>
    </div>
  );
}
