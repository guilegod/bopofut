import styles from "./PlayerCard.module.css";

export default function PlayerCard({ user, isOwner, achievements, onMiniAchievement }) {
  const unlocked = user?.unlockedAchievementIds || [];

  return (
    <section className={`${styles.card} ${isOwner ? styles.owner : styles.player}`}>
      <div className={styles.topGlow} />

      <div className={styles.row}>
        <div className={styles.avatarBox}>
          <img src={user.avatar} alt={user.name} className={styles.avatar} />
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{user.name}</h2>
            {user.isVerified && <span className={styles.verified}>✔</span>}
          </div>

          <div className={styles.badge}>
            {isOwner ? "Dono de Arena" : "Craque Bópô Fut"}
          </div>

          {!isOwner && (
            <div className={styles.miniBadges}>
              {unlocked.length ? (
                unlocked.map((id) => {
                  const ach = achievements.find((a) => a.id === id);
                  if (!ach) return null;
                  return (
                    <button
                      key={id}
                      className={styles.mini}
                      onClick={() => onMiniAchievement?.(ach)}
                      title={ach.title}
                    >
                      {ach.icon}
                    </button>
                  );
                })
              ) : (
                <div className={styles.beginner}>Iniciante</div>
              )}
            </div>
          )}

          <div className={styles.statsRow}>
            {!isOwner ? (
              <>
                <Stat label="Gols" value={user.stats?.goals ?? 0} />
                <Stat label="Assists" value={user.stats?.assists ?? 0} />
                <Stat label="Jogos" value={user.stats?.gamesPlayed ?? 0} />
              </>
            ) : (
              <>
                <Stat label="Estrelas" value="4.9" />
                <Stat label="Check-ins" value="312" />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 1000, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.75, fontWeight: 900 }}>
        {label}
      </div>
    </div>
  );
}
