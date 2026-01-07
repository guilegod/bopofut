import styles from "./Modal.module.css";

export default function FriendStatsModal({ friend, achievements, onClose }) {
  const unlocked = friend.unlockedAchievementIds || [];

  return (
    <div className={styles.overlay}>
      <button className={styles.backdrop} onClick={onClose} aria-label="Fechar" />
      <div className={styles.modal}>
        <div className={styles.friendTop}>
          <img src={friend.avatar} alt={friend.name} className={styles.friendAvatar} />
          <div className={styles.friendInfo}>
            <div className={styles.friendName}>{friend.name}</div>
            <div className={styles.friendSub}>Posição: {friend.position || "Curinga"}</div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <Stat label="Gols" value={friend.stats?.goals ?? 0} />
          <Stat label="Assists" value={friend.stats?.assists ?? 0} />
          <Stat label="Jogos" value={friend.stats?.gamesPlayed ?? 0} />
        </div>

        <div className={styles.box}>
          <div className={styles.label} style={{ marginBottom: 10 }}>Medalhas</div>
          <div className={styles.medals}>
            {unlocked.length ? (
              unlocked.map((id) => {
                const ach = achievements.find((a) => a.id === id);
                if (!ach) return null;
                return (
                  <div key={id} className={styles.medal}>
                    {ach.icon}
                  </div>
                );
              })
            ) : (
              <div className={styles.muted}>Iniciando a carreira...</div>
            )}
          </div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
