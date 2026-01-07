import styles from "./QuickFriends.module.css";

export default function QuickFriends({ friends, onOpenFriends, onSelectFriend }) {
  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h3 className={styles.title}>Seu Elenco</h3>
        <button className={styles.link} onClick={onOpenFriends}>
          Ver Tudo
        </button>
      </div>

      <div className={styles.row}>
        {friends.map((f) => (
          <button key={f.id} className={styles.card} onClick={() => onSelectFriend(f)}>
            <div className={styles.avatarWrap}>
              <img src={f.avatar} alt={f.name} className={styles.avatar} />
              <div className={`${styles.dot} ${f.stats?.gamesPlayed > 0 ? styles.on : styles.off}`} />
            </div>
            <div className={styles.name}>{f.name.split(" ")[0]}</div>
            <div className={styles.pos}>{f.position || "Jogador"}</div>
          </button>
        ))}

        <button className={styles.add} onClick={onOpenFriends}>
          <div className={styles.addCircle}>＋</div>
          <div className={styles.addText}>Novo Amigo</div>
        </button>
      </div>
    </section>
  );
}
