import { useState } from "react";
import styles from "./ChatTab.module.css";

export default function ChatTab({ match, user, onNewMessage, chatEndRef }) {
  const [text, setText] = useState("");

  function send() {
    if (!text.trim() || !onNewMessage) return;

    const msg = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onNewMessage(msg);
    setText("");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {match.messages?.length ? (
          match.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`${styles.msgRow} ${mine ? styles.right : styles.left}`}>
                <div className={`${styles.bubble} ${mine ? styles.mine : styles.other}`}>
                  {!mine && <div className={styles.sender}>{m.senderName}</div>}
                  <div className={styles.text}>{m.text}</div>
                  <div className={styles.time}>{m.timestamp}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.empty}>Nenhuma resenha iniciada ainda.</div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mande o papo..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className={styles.send} onClick={send} disabled={!text.trim()}>
          →
        </button>
      </div>
    </div>
  );
}
