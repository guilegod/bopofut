import styles from "../ranking.module.css";

export default function RankingTable({ users = [] }) {
  return (
    <div className={styles.table}>
      <div className={styles.tableHeader}>
        <span>P</span>
        <span>Craque</span>
        <span>J</span>
        <span>G</span>
        <span>A</span>
      </div>

      {users.map((u, i) => (
        <div key={u.id} className={styles.row}>
          <span className={styles.pos}>{i + 1}</span>

          <div className={styles.player}>
            <img src={u.avatar} alt={u.name} />
            <span>{u.name}</span>
          </div>

          <span>{u.stats.gamesPlayed}</span>
          <span>{u.stats.goals}</span>
          <span>{u.stats.assists}</span>
        </div>
      ))}
    </div>
  );
}
