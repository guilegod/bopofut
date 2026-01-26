import { useMemo, useState } from "react";
import styles from "../SquarePage.module.css";
import { badgeClass, btnClass } from "../utils/ui";

export default function SectionTeams({
  teams,
  user,
  sports = [],
  onCreate,
  onJoin,
  onLeave,
  onDelete,
  onOpenTeam, // ✅ novo
}) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState(sports?.[0] || "");
  const [badgeUrl, setBadgeUrl] = useState("");

  const canUse = !!user?.id;
  const list = useMemo(() => teams || [], [teams]);

  function isMember(team) {
    return !!user?.id && (team.members || []).some((m) => m.id === user.id);
  }

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>🛡️ Times da praça</div>
        <span className={badgeClass("muted")}>{list.length} times</span>
      </div>

      {!canUse ? (
        <div className={styles.softCard}>
          <div className={styles.title}>🔒 Login necessário</div>
          <div className={styles.hint}>Entre para criar ou entrar em times.</div>
        </div>
      ) : (
        <div className={styles.softCard}>
          <div className={styles.title}>Criar time</div>

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              placeholder="Nome do time"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button
              type="button"
              className={btnClass("primary")}
              onClick={() => {
                const n = String(name || "").trim();
                if (!n) return;
                onCreate({ name: n, sport, badgeUrl });
                setName("");
                setBadgeUrl("");
              }}
            >
              Criar
            </button>
          </div>

          <div className={styles.inputRow}>
            <select
              className={styles.input}
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            >
              <option value="">Esporte (opcional)</option>
              {(sports || []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              className={styles.input}
              placeholder="Escudo (URL opcional)"
              value={badgeUrl}
              onChange={(e) => setBadgeUrl(e.target.value)}
            />
          </div>

          <div className={styles.hint}>
            Depois a gente adiciona: chat do time, roles (capitão/coach), desafios e campeonatos.
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className={styles.softCard} style={{ marginTop: 12 }}>
          <div className={styles.title}>Ainda não tem times</div>
          <div className={styles.hint}>Crie o primeiro time dessa praça 😄</div>
        </div>
      ) : (
        <div className={styles.presenceList}>
          {list.map((t) => {
            const mine = user?.id && t.captain?.id === user.id;
            const member = isMember(t);

            return (
              <div key={t.id} className={styles.presenceRow}>
                <div className={styles.presenceLeft}>
                  <div className={styles.avatar}>
                    {t.badgeUrl ? (
                      <img className={styles.avatarImg} src={t.badgeUrl} alt="" />
                    ) : (
                      (t.name || "?").slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div className={styles.nameBlock}>
                    <div className={styles.nameRow}>
                      <div className={styles.name}>{t.name}</div>
                      {t.sport ? <span className={badgeClass("info")}>{t.sport}</span> : null}
                      {mine ? <span className={badgeClass("live")}>Capitão</span> : null}
                      {member && !mine ? <span className={badgeClass("muted")}>Membro</span> : null}
                    </div>

                    <div className={styles.sub}>
                      👥 {(t.members || []).length} • capitão: <b>{t.captain?.name || "—"}</b>
                    </div>
                  </div>
                </div>

                <div className={styles.tabs}>
                  <button
                    type="button"
                    className={btnClass("soft")}
                    onClick={() => onOpenTeam?.(t)}
                    title="Abrir detalhes do time"
                  >
                    Abrir
                  </button>

                  {!member ? (
                    <button type="button" className={btnClass("primary")} onClick={() => onJoin(t.id)}>
                      Entrar
                    </button>
                  ) : mine ? (
                    <button type="button" className={btnClass("danger")} onClick={() => onDelete(t.id)}>
                      Apagar
                    </button>
                  ) : (
                    <button type="button" className={btnClass("ghost")} onClick={() => onLeave(t.id)}>
                      Sair
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
