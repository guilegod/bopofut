import { useEffect, useRef } from "react";
import styles from "../SquarePage.module.css";
import { badgeClass, btnClass } from "../utils/ui";
import { safeNow } from "../utils/maps";

export default function SectionChat({
  messages,
  text,
  setText,
  user,
  cooldownUntil,
  sendError,
  onSend,
  onOpenPlayer, // ✅ novo
}) {
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages?.length]);

  function handleOpen(m) {
    if (typeof onOpenPlayer !== "function") return;
    onOpenPlayer({
      userId: m.userId,
      name: m.name,
      avatar: m.avatar || "",
      position: m.position || "—",
      level: m.level || 1,
      xp: m.xp || 0,
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>💬 Chat da praça</div>
        <span className={badgeClass("muted")}>{messages.length} mensagens</span>
      </div>

      <div ref={listRef} className={styles.chatList}>
        {messages.length === 0 ? (
          <div className={styles.softCard}>
            <div className={styles.title}>Sem mensagens ainda</div>
            <div className={styles.hint}>
              Puxa a resenha 😄 Combine horário, chame mais gente e compartilhe o link da praça.
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={styles.msgCard}>
              <div className={styles.msgHeader}>
                <button
                  type="button"
                  onClick={() => handleOpen(m)}
                  className={styles.msgHeaderLeft}
                  style={{ cursor: "pointer", background: "transparent", border: 0, padding: 0, textAlign: "left" }}
                  title="Abrir perfil do jogador"
                >
                  <div className={styles.name}>{m.name}</div>
                  {user?.id && m.userId === user.id ? <span className={badgeClass("info")}>você</span> : null}
                </button>

                <div className={styles.msgTime}>
                  {new Date(m.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div className={styles.msgText}>{m.text}</div>
            </div>
          ))
        )}
      </div>

      <div className={styles.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user?.id ? "Mensagem..." : "Faça login para conversar"}
          className={styles.input}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
          disabled={!user?.id}
        />

        <button
          type="button"
          className={btnClass("primary")}
          onClick={onSend}
          disabled={!user?.id || safeNow() < cooldownUntil}
        >
          Enviar
        </button>
      </div>

      {sendError ? <div className={styles.hint}>⚠️ {sendError}</div> : null}
      {safeNow() < cooldownUntil ? <div className={styles.hint}>⏳ Espera 2s pra mandar outra</div> : null}
      <div className={styles.hint}>💡 Dica: marque presença para “acender” a praça no Ao Vivo.</div>
    </div>
  );
}
