import styles from "../friends.module.css";

export default function FriendCard({ friend }) {
  const online = friend.status !== "Offline";

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.avatarWrap}>
          <img src={friend.avatar} alt={friend.name} />
          <span className={`${styles.dot} ${online ? styles.on : styles.off}`} />
        </div>

        <div>
          <p className={styles.name}>{friend.name}</p>
          <p className={styles.meta}>
            {friend.position} • {friend.status}
          </p>
        </div>
      </div>

      <button className={styles.more}>⋯</button>
    </div>
  );
}
