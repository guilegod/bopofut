import styles from "../SquarePage.module.css";
import { badgeClass, btnClass, toastCopy } from "../utils/ui";
import { minutesLeft } from "../utils/maps";

export default function SectionPresence({
  presence,
  isLive,
  presenceCount,
  user,
  deepLink,
  onCheckIn,
  checkinLoading,
  onOpenPlayer, // ✅ novo
}) {
  function handleOpen(p) {
    if (typeof onOpenPlayer === "function") onOpenPlayer(p);
  }

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>👥 Quem está na praça</div>
        <span className={badgeClass(isLive ? "live" : "muted")}>
          {isLive ? `${presenceCount} agora` : "Ninguém agora"}
        </span>
      </div>

      {presenceCount === 0 ? (
        <div className={styles.softCard}>
          <div className={styles.title}>⚪ Praça vazia</div>
          <div className={styles.hint}>
            Seja o primeiro a marcar presença. Quando você faz check-in, a praça aparece “ao vivo” na home.
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={btnClass("primary")}
              onClick={onCheckIn}
              disabled={checkinLoading || !user?.id}
            >
              ✅ Marcar presença
            </button>
            <button type="button" className={btnClass("ghost")} onClick={() => toastCopy(deepLink, "Link copiado ✅")}>
              🔗 Compartilhar link
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.presenceList}>
          {presence.map((p) => {
            const left = minutesLeft(p.expiresAt);
            const leftLabel = left == null ? "—" : `${left} min`;
            const isMe = user?.id && p.userId === user.id;

            return (
              <button
                key={p.userId}
                type="button"
                className={styles.presenceRow}
                onClick={() => handleOpen(p)}
                style={{ cursor: "pointer", textAlign: "left", width: "100%", background: "transparent", border: 0 }}
                title="Abrir perfil do jogador"
              >
                <div className={styles.presenceLeft}>
                  <div className={styles.avatar}>
                    {p.avatar ? (
                      <img className={styles.avatarImg} src={p.avatar} alt="" />
                    ) : (
                      (p.name || "?").slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div className={styles.nameBlock}>
                    <div className={styles.nameRow}>
                      <div className={styles.name}>{p.name}</div>
                      {isMe ? <span className={badgeClass("info")}>Você</span> : null}
                    </div>
                    <div className={styles.sub}>
                      {p.position || "—"} • {p.level || "—"}
                    </div>
                  </div>
                </div>

                <div className={styles.rightSmall}>
                  expira em <b>{leftLabel}</b>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
