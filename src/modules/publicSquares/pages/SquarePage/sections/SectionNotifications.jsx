import styles from "../SquarePage.module.css";
import { badgeClass, btnClass } from "../utils/ui";

function typeBadge(type) {
  if (type === "success") return badgeClass("live");
  if (type === "warn") return badgeClass("warn");
  return badgeClass("info");
}

export default function SectionNotifications({ items, onClear, onOpen }) {
  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>🔔 Notificações da praça</div>

        <div className={styles.tabs}>
          <span className={badgeClass("muted")}>{items.length}</span>
          {items.length > 0 ? (
            <button type="button" className={btnClass("ghost")} onClick={onClear}>
              Limpar
            </button>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.softCard}>
          <div className={styles.title}>Sem notificações</div>
          <div className={styles.hint}>Desafios / aceites / recusas aparecem aqui.</div>
        </div>
      ) : (
        <div className={styles.presenceList}>
          {items.map((n) => {
            const challengeId = n?.meta?.challengeId || null;
            const clickable = !!challengeId;

            return (
              <button
                key={n.id}
                type="button"
                className={styles.notiRowBtn}
                onClick={() => clickable && onOpen?.({ type: "challenge", challengeId })}
                disabled={!clickable}
                title={clickable ? "Abrir desafio" : "Sem link"}
              >
                <div className={styles.presenceRow}>
                  <div className={styles.presenceLeft}>
                    <div className={styles.nameBlock}>
                      <div className={styles.nameRow}>
                        <div className={styles.name}>{n.title}</div>
                        <span className={typeBadge(n.type)}>{n.type}</span>
                      </div>
                      <div className={styles.sub}>
                        {n.text} •{" "}
                        {new Date(n.at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className={styles.rightSmall}>
                    <span className={badgeClass(clickable ? "info" : "muted")}>
                      {clickable ? "abrir" : "praça"}
                    </span>
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
