import styles from "../ranking.module.css";

export default function Podium({ users = [] }) {
  const [first, second, third] = users;

  return (
    <section className={styles.podium}>
      {second && <PodiumItem user={second} place="2" />}
      {first && <PodiumItem user={first} place="1" highlight />}
      {third && <PodiumItem user={third} place="3" />}
    </section>
  );
}

function PodiumItem({ user, place, highlight }) {
  return (
    <div className={`${styles.podiumItem} ${highlight ? styles.first : ""}`}>
      <img src={user.avatar} alt={user.name} />
      <span className={styles.medal}>{place}</span>
      <strong>{user.name.split(" ")[0]}</strong>
      <small>{user.stats.goals} G</small>
    </div>
  );
}
