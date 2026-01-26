import { useMemo } from "react";
import styles from "../SquarePage.module.css";
import { badgeClass } from "../utils/ui";
import * as XpStore from "../utils/xpStore.js";

function avatarFallback(name = "—") {
  return String(name || "—").slice(0, 1).toUpperCase();
}

export default function SectionRanking({ squareId, user, onOpenPlayer }) {
  const board = useMemo(() => XpStore.getLeaderboard(squareId, { limit: 50 }), [squareId]);
  const myRank = useMemo(() => XpStore.getRankOfUser(squareId, user?.id), [squareId, user?.id]);

  const myEntry = useMemo(() => {
    if (!user?.id) return null;
    return XpStore.getUser(squareId, user);
  }, [squareId, user]);

  function open(p) {
    if (typeof onOpenPlayer !== "function") return;
    onOpenPlayer({
      userId: p.userId,
      name: p.name,
      avatar: p.avatar || "",
      level: p.level || 1,
      xp: p.xp || 0,
      position: p.position || "—",
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>🏆 Ranking da praça</div>
        <span className={badgeClass("muted")}>{board.length} jogadores</span>
      </div>

      {!user?.id ? (
        <div className={styles.softCard}>
          <div className={styles.title}>🔒 Login necessário</div>
          <div className={styles.hint}>Entre para aparecer no ranking e ganhar XP.</div>
        </div>
      ) : (
        <div className={styles.softCard}>
          <div className={styles.title}>Seu status</div>
          <div className={styles.hint}>
            {myRank ? (
              <>
                Você está em <b>#{myRank}</b> • Level <b>{myEntry?.level || 1}</b> • <b>{myEntry?.xp || 0} XP</b>
              </>
            ) : (
              <>Faça ações na praça (check-in, chat, time, foto) para entrar no ranking.</>
            )}
          </div>
        </div>
      )}

      {board.length === 0 ? (
        <div className={styles.softCard} style={{ marginTop: 12 }}>
          <div className={styles.title}>Ainda não tem ranking</div>
          <div className={styles.hint}>Seja o primeiro a ganhar XP nessa praça 😄</div>
        </div>
      ) : (
        <div className={styles.presenceList} style={{ marginTop: 12 }}>
          {board.map((p, idx) => {
            const isMe = user?.id && p.userId === user.id;
            const rank = idx + 1;

            return (
              <button
                key={p.userId}
                type="button"
                className={styles.presenceRow}
                onClick={() => open(p)}
                style={{ cursor: "pointer", textAlign: "left", width: "100%", background: "transparent", border: 0 }}
                title="Abrir perfil do jogador"
              >
                <div className={styles.presenceLeft}>
                  <div className={styles.avatar}>
                    {p.avatar ? <img src={p.avatar} alt="" /> : <div className={styles.avatarFallback}>{avatarFallback(p.name)}</div>}
                  </div>

                  <div className={styles.nameBlock}>
                    <div className={styles.nameRow}>
                      <div className={styles.name}>
                        #{rank} {p.name} {isMe ? <span className={badgeClass("info")}>você</span> : null}
                      </div>
                      <span className={badgeClass(rank <= 3 ? "live" : "muted")}>LVL {p.level}</span>
                    </div>
                    <div className={styles.sub}>
                      <b>{p.xp}</b> XP
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
