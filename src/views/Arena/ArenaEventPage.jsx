// src/views/Arena/ArenaEventPage.jsx
// ✅ Página de detalhes do Evento (rota)
// /app/arena/:arenaId/event/:eventId

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ArenaEventPage.module.css";

function formatMoneyBRL(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "R$ 0";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

// Se você já tem API, substitui isso por fetch real:
function getDemoEvent(eventId) {
  return {
    id: eventId,
    title: "Torneio Fut7 • Categoria Ouro",
    date: "2026-02-02",
    timeFrom: "19:30",
    timeTo: "22:30",
    sport: "Fut7",
    price: 20,
    status: "aberto",
    description:
      "Inscrições abertas! Regras: time com 7 jogadores, 2 reservas. Premiação para 1º e 2º. Chegar 15min antes.",
    coverUrl: "", // se tiver imagem, coloca aqui
    locationNote: "Arena • Quadra 1",
  };
}

export default function ArenaEventPage({ events = [], arena = null, onJoinEvent }) {
  const nav = useNavigate();
  const { arenaId, eventId } = useParams();

  const event = useMemo(() => {
    // 1) tenta achar em props
    const found = (events || []).find((e) => String(e.id) === String(eventId));
    if (found) return found;

    // 2) fallback demo (pra nunca quebrar)
    return getDemoEvent(eventId);
  }, [events, eventId]);

  const heroBg = event.coverUrl || arena?.coverUrl || arena?.logoUrl || "";

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <button type="button" className={styles.backBtn} onClick={() => nav(-1)} aria-label="Voltar" title="Voltar">
          ←
        </button>

        <div className={styles.topbarCenter}>
          <div className={styles.topbarTitle}>Evento</div>
          <div className={styles.topbarSubtitle}>
            {arena?.name ? arena.name : `Arena ${arenaId || ""}`}
          </div>
        </div>

        <div className={styles.topbarRight} />
      </header>

      {/* Hero */}
      <section className={styles.hero} style={heroBg ? { ["--hero-bg"]: `url(${heroBg})` } : undefined}>
        <div className={styles.heroGlow} />

        <div className={styles.heroInner}>
          <div className={styles.heroTitle}>{event.title || "Evento"}</div>

          <div className={styles.heroMeta}>
            <span className={styles.pill}>📅 {event.date || "---- -- --"}</span>
            <span className={styles.pill}>⏰ {event.timeFrom || "--:--"} {event.timeTo ? `– ${event.timeTo}` : ""}</span>
            {event.sport ? <span className={styles.pill}>⚽ {event.sport}</span> : null}
            {typeof event.price !== "undefined" ? (
              <span className={styles.pill}>💸 {Number(event.price) ? formatMoneyBRL(event.price) : "Grátis"}</span>
            ) : null}
            {event.status ? <span className={cx(styles.pill, styles.pillAlt)}>{String(event.status).toUpperCase()}</span> : null}
          </div>

          {event.locationNote ? <div className={styles.heroSub}>📍 {event.locationNote}</div> : null}

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => (onJoinEvent ? onJoinEvent(event.id) : null)}
              disabled={!onJoinEvent}
              title={onJoinEvent ? "Participar" : "Em breve"}
            >
              Participar
            </button>

            <button type="button" className={styles.ghostBtn} onClick={() => nav(-1)}>
              Voltar
            </button>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Descrição</div>
          <div className={styles.cardText}>
            {event.description || "Sem descrição ainda. O dono da arena vai publicar as regras e detalhes aqui."}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Informações</div>
          <ul className={styles.list}>
            <li className={styles.li}>✅ Pagamento: {typeof event.price !== "undefined" ? (Number(event.price) ? "Pago" : "Grátis") : "—"}</li>
            <li className={styles.li}>✅ Modalidade: {event.sport || "—"}</li>
            <li className={styles.li}>✅ Data: {event.date || "—"}</li>
            <li className={styles.li}>✅ Horário: {event.timeFrom || "--:--"} {event.timeTo ? `– ${event.timeTo}` : ""}</li>
          </ul>
        </div>
      </section>

      {/* Rodapé info */}
      <section className={styles.notice}>
        <div className={styles.noticeTitle}>⚙️ Próximo passo</div>
        <div className={styles.noticeText}>
          Quando você ligar o backend do dono da arena, essa tela passa a carregar o evento real pelo <b>eventId</b>.
        </div>
      </section>
    </div>
  );
}
