import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ChatTab.module.css";

import { apiRequest } from "../../../services/api.js";
import { getToken } from "../../../services/authService.js";

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatTab({ matchId, user, chatEndRef }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ indicador
  const [newCount, setNewCount] = useState(0);

  const sendingRef = useRef(false);
  const mountedRef = useRef(true);

  // controla polling sem ficar “batendo” toda hora
  const lastAfterRef = useRef(null); // ISO do createdAt da última msg
  const pollingRef = useRef(null);

  // detectar se usuário está “no final”
  const listRef = useRef(null);
  const isNearBottomRef = useRef(true);

  function updateIsNearBottom() {
    const el = listRef.current;
    if (!el) return;
    const threshold = 140; // px
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distance < threshold;
  }

  function scrollToBottom(smooth = true) {
    setTimeout(() => chatEndRef?.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" }), 30);
  }

  async function loadInitial() {
    if (!matchId) return;
    setLoading(true);

    try {
      const token = getToken();
      const list = await apiRequest(`/matches/${matchId}/messages`, { token });

      if (!mountedRef.current) return;

      const arr = Array.isArray(list) ? list : [];
      setMessages(arr);

      const last = arr[arr.length - 1];
      lastAfterRef.current = last?.createdAt || null;

      setNewCount(0);
      setTimeout(() => scrollToBottom(false), 30);
    } catch (e) {
      console.error("load messages error:", e);
      if (mountedRef.current) setMessages([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function pollNew() {
    if (!matchId) return;

    try {
      const token = getToken();
      const after = lastAfterRef.current;

      // ✅ busca só mensagens novas
      const list = await apiRequest(
        `/matches/${matchId}/messages/since${after ? `?after=${encodeURIComponent(after)}` : ""}`,
        { token }
      );

      if (!mountedRef.current) return;

      const arr = Array.isArray(list) ? list : [];
      if (!arr.length) return; // ✅ não mexe em state => sem “loop”

      // ✅ evita duplicar
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const merged = [...prev];
        for (const m of arr) {
          if (!seen.has(m.id)) merged.push(m);
        }
        return merged;
      });

      // atualiza marcador “after”
      const last = arr[arr.length - 1];
      lastAfterRef.current = last?.createdAt || after || null;

      // se usuário está no fim, auto-scroll
      if (isNearBottomRef.current) {
        setNewCount(0);
        scrollToBottom(true);
      } else {
        setNewCount((c) => c + arr.length);
      }
    } catch (e) {
      // se der erro, só ignora (não derruba UI)
      console.error("poll error:", e);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    // reset
    setMessages([]);
    setNewCount(0);
    lastAfterRef.current = null;

    loadInitial();

    // ✅ polling mais suave (6s)
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      pollNew();
    }, 6000);

    return () => {
      mountedRef.current = false;
      clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function send() {
    const content = text.trim();
    if (!content || !matchId || sendingRef.current) return;

    sendingRef.current = true;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      text: content,
      createdAt: new Date().toISOString(),
      userId: user?.id,
      user: { id: user?.id, name: user?.name, imageUrl: user?.imageUrl },
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setNewCount(0);
    scrollToBottom(true);

    try {
      const token = getToken();
      const saved = await apiRequest(`/matches/${matchId}/messages`, {
        method: "POST",
        token,
        body: { text: content },
      });

      if (!mountedRef.current) return;

      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));

      // atualiza o after para não “rebaixar”
      lastAfterRef.current = saved?.createdAt || lastAfterRef.current;

      scrollToBottom(true);
    } catch (e) {
      console.error("send message error:", e);
      if (mountedRef.current) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setText(content);
      }
      alert("Não foi possível enviar a mensagem.");
    } finally {
      sendingRef.current = false;
    }
  }

  const uiMessages = useMemo(() => {
    const meId = user?.id ? String(user.id) : "";
    return (messages || []).map((m) => {
      const senderId = m.userId ?? m.user?.id;
      const senderName = m.user?.name ?? "Usuário";
      const mine = senderId && meId ? String(senderId) === meId : false;

      return {
        id: m.id,
        mine,
        senderName,
        text: String(m.text ?? m.content ?? ""),
        time: fmtTime(m.createdAt ?? new Date().toISOString()),
      };
    });
  }, [messages, user?.id]);

  return (
    <div className={styles.wrap}>
      {/* ✅ Indicador de novas mensagens */}
      {newCount > 0 && (
        <button
          type="button"
          className={styles.newBadge}
          onClick={() => {
            setNewCount(0);
            scrollToBottom(true);
          }}
          title="Ver novas mensagens"
        >
          {newCount} nova{newCount > 1 ? "s" : ""} ↓
        </button>
      )}

      <div
        ref={listRef}
        className={styles.list}
        onScroll={() => {
          updateIsNearBottom();
          if (isNearBottomRef.current) setNewCount(0);
        }}
      >
        {loading ? (
          <div className={styles.empty}>Carregando resenha...</div>
        ) : uiMessages.length ? (
          uiMessages.map((m) => (
            <div key={m.id} className={`${styles.msgRow} ${m.mine ? styles.right : styles.left}`}>
              <div className={`${styles.bubble} ${m.mine ? styles.mine : styles.other}`}>
                {!m.mine && <div className={styles.sender}>{m.senderName}</div>}
                <div className={styles.text}>{m.text}</div>
                <div className={styles.time}>{m.time}</div>
              </div>
            </div>
          ))
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
