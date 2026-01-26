import styles from "../SquarePage.module.css";
import { badgeClass, btnClass } from "../utils/ui";

export default function PlayerSectionOverview({
  player,
  rank,

  // ✅ novos callbacks
  onAddFriend,
  onChallenge,
  isFriend,
}) {
  if (!player) return null;

  return (
    <div className={styles.softCard}>
      <div className={styles.title}>Resumo</div>

      <div className={styles.playerRow}>
        <div className={styles.avatarLg}>
          {player.avatar ? (
            <img src={player.avatar} alt="" />
          ) : (
            <div className={styles.avatarFallback}>
              {(player.name || "?")[0]}
            </div>
          )}
        </div>

        <div className={styles.nameBlock}>
          <div className={styles.nameRow}>
            <div className={styles.name}>{player.name}</div>
            {rank ? <span className={badgeClass("info")}>#{rank}</span> : null}
            <span className={badgeClass("live")}>LVL {player.level}</span>
          </div>

          <div className={styles.sub}>
            <b>{player.xp}</b> XP
          </div>
        </div>
      </div>

      {/* 🔥 BOTÕES SOCIAIS */}
      <div className={styles.actions} style={{ marginTop: 14 }}>
        {!isFriend ? (
          <button
            className={btnClass("primary")}
            onClick={() => onAddFriend?.(player)}
          >
            ➕ Adicionar Amigo
          </button>
        ) : (
          <span className={badgeClass("info")}>🤝 Já são amigos</span>
        )}

        <button
          className={btnClass("ghost")}
          onClick={() => onChallenge?.(player)}
        >
          ⚔️ Desafiar com meu time
        </button>
      </div>

      <div className={styles.hint} style={{ marginTop: 10 }}>
        Depois a gente coloca: bio, cidade, posição, estilo de jogo, histórico de partidas, etc.
      </div>
    </div>
  );
}
