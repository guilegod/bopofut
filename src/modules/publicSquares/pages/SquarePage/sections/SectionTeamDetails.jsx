import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../SquarePage.module.css";
import { badgeClass, btnClass } from "../utils/ui";
import * as TeamChatStore from "../utils/teamChatStore.js";

export default function SectionTeamDetails({
  squareId,
  team,
  user,
  onBackToTeams,
  onJoin,
  onLeave,
  onDelete,
}) {
  const [tText, setTText] = useState("");
  const [tMessages, setTMessages] = useState([]);
  const listRef = useRef(null);

  const isCaptain = user?.id && team?.captain?.id === user.id;

  const isMember = useMemo(() => {
    return !!user?.id && (team?.members || []).some((m) => m.id === user.id);
  }, [team, user?.id]);

  useEffect(() => {
    setTMessages(TeamChatStore.listTeamMessages(squareId, team?.id));
  }, [squareId, team?.id]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  }, [tMessages.length]);

  function handleSend() {
    if (!user?.id) return;
    if (!isMember) return;
    if (!squareId || !team?.id) return;

    const next = TeamChatStore.sendTeamMessage(squareId, team.id, user, tText);
    setTMessages(next);
    setTText("");
  }

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div style={{ display: "grid", gap: 6 }}>
          <div className={styles.title}>🛡️ {team?.name}</div>
          <div className={styles.hint}>
            {team?.sport ? (
              <span className={badgeClass("info")}>{team.sport}</span>
            ) : (
              <span className={badgeClass("muted")}>sem esporte</span>
            )}{" "}
            • capitão: <b>{team?.captain?.name || "—"}</b>
          </div>
        </div>

        <div className={styles.tabs}>
          <button type="button" className={btnClass("ghost")} onClick={onBackToTeams}>
            ← Voltar
          </button>

          {!isMember ? (
            <button type="button" className={btnClass("primary")} onClick={() => onJoin?.(team.id)}>
              Entrar
            </button>
          ) : isCaptain ? (
            <button type="button" className={btnClass("danger")} onClick={() => onDelete?.(team.id)}>
              Apagar
            </button>
          ) : (
            <button type="button" className={btnClass("ghost")} onClick={() => onLeave?.(team.id)}>
              Sair
            </button>
          )}
        </div>
      </div>

      {/* membros */}
      <div className={styles.softCard} style={{ marginTop: 12 }}>
        <div className={styles.title}>👥 Membros ({(team?.members || []).length})</div>

        <div className={styles.presenceList} style={{ marginTop: 10 }}>
          {(team?.members || []).map((m) => (
            <div key={m.id} className={styles.presenceRow}>
              <div className={styles.presenceLeft}>
                <div className={styles.avatar}>
                  {(m.name || "?").slice(0, 1).toUpperCase()}
                </div>

                <div className={styles.nameBlock}>
                  <div className={styles.nameRow}>
                    <div className={styles.name}>{m.name}</div>

                    {team?.captain?.id === m.id ? (
                      <span className={badgeClass("live")}>Capitão</span>
                    ) : null}

                    {user?.id === m.id ? (
                      <span className={badgeClass("info")}>Você</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* chat do time */}
      <div className={styles.softCard} style={{ marginTop: 12 }}>
        <div className={styles.sectionHeader}>
          <div className={styles.title}>💬 Chat do time</div>
          <span className={badgeClass("muted")}>{tMessages.length} mensagens</span>
        </div>

        {!user?.id ? (
          <div className={styles.hint}>🔒 Faça login para conversar.</div>
        ) : !isMember ? (
          <div className={styles.hint}>⚠️ Entre no time para participar do chat.</div>
        ) : (
          <>
            <div ref={listRef} className={styles.chatList} style={{ maxHeight: 260 }}>
              {tMessages.length === 0 ? (
                <div className={styles.hint}>Sem mensagens ainda. Puxa a resenha 😄</div>
              ) : (
                tMessages.map((m) => (
                  <div key={m.id} className={styles.msgCard}>
                    <div className={styles.msgHeader}>
                      <div className={styles.msgHeaderLeft}>
                        <div className={styles.name}>{m.name}</div>
                        {user?.id && m.userId === user.id ? (
                          <span className={badgeClass("info")}>você</span>
                        ) : null}
                      </div>

                      <div className={styles.msgTime}>
                        {new Date(m.at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className={styles.msgText}>{m.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.inputRow} style={{ marginTop: 10 }}>
              <input
                className={styles.input}
                value={tText}
                onChange={(e) => setTText(e.target.value)}
                placeholder="Mensagem do time..."
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button type="button" className={btnClass("primary")} onClick={handleSend}>
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
