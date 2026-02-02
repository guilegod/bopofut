// src/views/Arena/ArenaPublicPage.jsx
// BoraPô / BóPôFut — Página Pública da Arena (Premium)
// ✅ Sem libs externas | ✅ Safe-area (notch + navbar) | ✅ Eventos em modo CALENDÁRIO
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import styles from "./ArenaPublicPage.module.css";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function formatMoneyBRL(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "R$ 0";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatTimeRange(open, close) {
  if (!open && !close) return "";
  return `${open || "??:??"} – ${close || "??:??"}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(d) {
  // YYYY-MM-DD
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseISODate(iso) {
  // iso = YYYY-MM-DD
  if (!iso || typeof iso !== "string") return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function monthLabel(d) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d);
  } catch {
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}

function weekdayShorts() {
  // começando em segunda pra ficar BR
  return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
}

function startOfCalendarGrid(monthDate) {
  // grade 6x7 começando na segunda
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const day = first.getDay(); // 0=dom .. 6=sab
  const mondayIndex = (day + 6) % 7; // converte pra 0=seg .. 6=dom
  const start = new Date(first);
  start.setDate(first.getDate() - mondayIndex);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildCalendarCells(monthDate) {
  const start = startOfCalendarGrid(monthDate);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

/**
 * Props esperadas (flexível):
 * - arena: { name, city, address, logoUrl, coverUrl, sports: [], tags: [], phone, instagram, mapsUrl, about, facilities, gallery, open, close, shortCode }
 * - courts: [{ id, name, sport, priceHour, open, close, freeSlots, reservedSlots, slots: [{time, status}] }]
 * - events: [{ id, title, date: "YYYY-MM-DD", timeFrom, timeTo, coverUrl, sport, price, status, description }]
 * - dateLabel: string (ex: "seg., 02 de fev.")
 */
export default function ArenaPublicPage({
  arena,
  courts = [],
  events = [],
  dateLabel = "",
  onBack,
  onCreateMatch,     // (courtId?) => void
  onReserve,         // (courtId, time) => void
  onPreselectCourt,  // (courtId) => void
  onOpenEvent,       // (eventId) => void  (futuro)
}) {
  const [tab, setTab] = useState("courts"); // courts | events | live | spots
  const [expanded, setExpanded] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("Todas");

  // ✅ Router navigation (detalhes do evento)
  const nav = useNavigate();
  const { arenaId } = useParams();

  // --- quadras (data selecionada)
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));

  // --- calendário (mês + dia selecionado)
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayISO, setSelectedDayISO] = useState(() => toISODate(new Date()));

  const a = arena || {};
  const heroBg = a.coverUrl || a.logoUrl || "";
  const logo = a.logoUrl || "";
  const sports = Array.isArray(a.sports) ? a.sports : [];
  const tags = Array.isArray(a.tags) ? a.tags : [];

  const filteredCourts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (courts || [])
      .filter((c) => {
        const sportOk =
          sportFilter === "Todas"
            ? true
            : (c.sport || "").toLowerCase() === sportFilter.toLowerCase();
        if (!sportOk) return false;

        if (!q) return true;
        const hay = `${c.name || ""} ${c.sport || ""} ${a.city || ""} ${a.address || ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [courts, query, sportFilter, a.city, a.address]);

  const toggleCourt = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ===== EVENTOS (Calendário) =====

  // se não vier eventos ainda, cria uma demo (não quebra UI)
  const demoEvents = useMemo(() => {
    const today = new Date();
    const base = toISODate(today);
    const d2 = new Date(today); d2.setDate(today.getDate() + 3);
    const d3 = new Date(today); d3.setDate(today.getDate() + 9);

    return [
      { id: "demo-1", title: "Torneio Fut7 • Categoria Ouro", date: base, timeFrom: "19:30", timeTo: "22:30", sport: "Fut7", price: 20, status: "aberto", description: "Inscrições abertas (demo)." },
      { id: "demo-2", title: "Promoção • Chopp + Quadra", date: toISODate(d2), timeFrom: "18:00", timeTo: "23:00", sport: "Futsal", price: 0, status: "promo", description: "Promoção especial (demo)." },
      { id: "demo-3", title: "Desafio • Rei da Quadra", date: toISODate(d3), timeFrom: "20:00", timeTo: "23:00", sport: "Society", price: 15, status: "aberto", description: "Ranking e premiação (demo)." },
    ];
  }, []);

  const effectiveEvents = (events && events.length) ? events : demoEvents;

  const eventsByDate = useMemo(() => {
    const map = new Map(); // dateISO -> events[]
    for (const ev of effectiveEvents) {
      const iso = ev.date;
      if (!iso) continue;
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push(ev);
    }
    // ordena por horário
    for (const [k, arr] of map.entries()) {
      arr.sort((a1, a2) => (a1.timeFrom || "").localeCompare(a2.timeFrom || ""));
      map.set(k, arr);
    }
    return map;
  }, [effectiveEvents]);

  const calendarCells = useMemo(() => buildCalendarCells(monthCursor), [monthCursor]);

  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(selectedDayISO) || [];
  }, [eventsByDate, selectedDayISO]);

  const goMonth = (delta) => {
    setMonthCursor((prev) => {
      const d = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      return d;
    });
  };

  const isSameMonth = (d, monthDate) => d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();

  const isTodayISO = (iso) => iso === toISODate(new Date());

  return (
    <div className={styles.page}>
      {/* ===== Topbar ===== */}
      {/* ===== HERO / BANNER ===== */}
      <section
        className={styles.hero}
        style={heroBg ? { ["--hero-bg"]: `url(${heroBg})` } : undefined}
      >
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.brandRow}>
              <div className={styles.logoWrap}>
                {logo ? (
                  <img src={logo} alt="Logo da arena" className={styles.logoImg} />
                ) : (
                  <div className={styles.logoPh}>🏟️</div>
                )}
              </div>

              <div className={styles.brandText}>
                <div className={styles.arenaName}>{a.name || "Nome da Arena"}</div>
                <div className={styles.arenaMeta}>
                  <span className={styles.dot}>📍</span>
                  <span>{a.city || "Cidade"}</span>
                  <span className={styles.sep}>•</span>
                  <span className={styles.metaFaint}>{a.address || "Endereço"}</span>
                </div>
              </div>
            </div>

            <div className={styles.chipsRow}>
              <span className={styles.chip}>
                🗓️ <b>{dateLabel || "hoje"}</b>
              </span>
              <span className={styles.chip}>
                ⏰ <b>{formatTimeRange(a.open, a.close) || "09:00 – 22:00"}</b>
              </span>

              {sports.slice(0, 4).map((s) => (
                <span key={s} className={styles.chipAlt}>
                  ⚽ {s}
                </span>
              ))}
            </div>

            <div className={styles.tagsRow}>
              {(tags.length ? tags : ["Piso: Sintético", "Vestiário", "Iluminação LED", "Churrasqueira"])
                .slice(0, 6)
                .map((t) => (
                  <span key={t} className={styles.tagPill}>
                    {t}
                  </span>
                ))}
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.heroBadge}>
              <div className={styles.badgeTitle}>{(a.shortCode || "F1").toString()}</div>
              <div className={styles.badgeSub}>Arena</div>
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => (onCreateMatch ? onCreateMatch() : null)}
              >
                + Criar pelada
              </button>

              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setTab("courts")}
              >
                Ver horários
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Tabs ===== */}
      <nav className={styles.tabs}>
        <button
          type="button"
          className={cx(styles.tab, tab === "courts" && styles.tabActive)}
          onClick={() => setTab("courts")}
        >
          Quadras
        </button>

        <button
          type="button"
          className={cx(styles.tab, tab === "events" && styles.tabActive)}
          onClick={() => setTab("events")}
        >
          Eventos
        </button>

        <button
          type="button"
          className={cx(styles.tab, tab === "live" && styles.tabActive)}
          onClick={() => setTab("live")}
        >
          Ao vivo
        </button>

        <button
          type="button"
          className={cx(styles.tab, tab === "spots" && styles.tabActive)}
          onClick={() => setTab("spots")}
        >
          Vagas
        </button>
      </nav>

      {/* ===== QUADRAS ===== */}
      {tab === "courts" ? (
        <>
          <section className={styles.filters}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Data</span>
              <input
                className={styles.input}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>

            <label className={styles.fieldGrow}>
              <span className={styles.fieldLabel}>Buscar</span>
              <input
                className={styles.input}
                type="search"
                placeholder="Nome da quadra, modalidade, endereço..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Modalidade</span>
              <select className={styles.input} value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}>
                <option>Todas</option>
                <option>Fut7</option>
                <option>Futsal</option>
                <option>Society</option>
                <option>Areia</option>
              </select>
            </label>
          </section>

          <section className={styles.list}>
            {filteredCourts.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>⚠️</div>
                <div className={styles.emptyTitle}>Nada encontrado</div>
                <div className={styles.emptySub}>Tente trocar a data, modalidade ou buscar por outro nome.</div>
              </div>
            ) : (
              filteredCourts.map((c) => {
                const isOpen = expanded.has(c.id);
                const totalFree = Number(c.freeSlots ?? 0);
                const totalRes = Number(c.reservedSlots ?? 0);
                const price = formatMoneyBRL(c.priceHour ?? 0);

                return (
                  <article key={c.id} className={styles.courtCard}>
                    <div className={styles.courtTop}>
                      <div className={styles.courtTitleRow}>
                        <div className={styles.courtName}>
                          {c.name || "Quadra"}{" "}
                          <span className={styles.courtSport}>• {c.sport || "Modalidade"}</span>
                        </div>

                        <div className={styles.courtBtns}>
                          <button
                            type="button"
                            className={styles.smallBtn}
                            onClick={() => (onCreateMatch ? onCreateMatch(c.id) : null)}
                          >
                            + Criar pelada
                          </button>

                          <button
                            type="button"
                            className={styles.smallBtnGhost}
                            onClick={() => (onPreselectCourt ? onPreselectCourt(c.id) : null)}
                          >
                            Pré-selecionar
                          </button>
                        </div>
                      </div>

                      <div className={styles.courtMetaRow}>
                        <div className={styles.metaLine}>
                          <span className={styles.metaPill}>💸 {price}/h</span>
                          <span className={styles.metaPill}>⏰ {formatTimeRange(c.open, c.close) || "09:00 – 22:00"}</span>
                          <span className={styles.metaPill}>
                            ✅ Livres: <b>{Number.isFinite(totalFree) ? totalFree : 0}</b>
                          </span>
                          <span className={styles.metaPill}>
                            ⛔ Reservados: <b>{Number.isFinite(totalRes) ? totalRes : 0}</b>
                          </span>
                        </div>

                        <button
                          type="button"
                          className={styles.expandBtn}
                          onClick={() => toggleCourt(c.id)}
                          aria-expanded={isOpen}
                        >
                          {isOpen ? "▾" : "▸"} Horários
                        </button>
                      </div>
                    </div>

                    {isOpen ? (
                      <div className={styles.slotsWrap}>
                        <div className={styles.legend}>
                          <span className={styles.legendItem}>
                            <i className={`${styles.dotLegend} ${styles.dotFree}`} /> Livre
                          </span>
                          <span className={styles.legendItem}>
                            <i className={`${styles.dotLegend} ${styles.dotBusy}`} /> Reservado
                          </span>
                        </div>

                        <div className={styles.slots}>
                          {(c.slots || []).length ? (
                            c.slots.map((s) => {
                              const st = (s.status || "").toLowerCase();
                              const isFree = st === "free" || st === "livre" || st === "";
                              return (
                                <button
                                  key={`${c.id}-${s.time}`}
                                  type="button"
                                  className={cx(styles.slot, isFree ? styles.slotFree : styles.slotBusy)}
                                  onClick={() => (isFree && onReserve ? onReserve(c.id, s.time) : null)}
                                  title={isFree ? "Reservar" : "Indisponível"}
                                  disabled={!isFree}
                                >
                                  {s.time}
                                </button>
                              );
                            })
                          ) : (
                            ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map((t, idx) => (
                              <button
                                key={`${c.id}-ph-${t}`}
                                type="button"
                                className={cx(styles.slot, idx % 5 === 0 ? styles.slotBusy : styles.slotFree)}
                                disabled={idx % 5 === 0}
                              >
                                {t}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </section>

          {/* Seções oficiais */}
          <section className={styles.grid2}>
            <div className={styles.infoCard}>
              <div className={styles.infoTitle}>Sobre a Arena</div>
              <div className={styles.infoText}>
                {a.about || "Uma descrição curta e premium vai aqui. O dono poderá editar e destacar diferenciais, fotos e regras da casa."}
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoTitle}>Estrutura</div>
              <ul className={styles.infoList}>
                {(a.facilities || ["Vestiário", "Banheiro", "Bebidas", "Estacionamento", "Iluminação"])
                  .slice(0, 6)
                  .map((x) => (
                    <li key={x} className={styles.infoLi}>
                      ✅ {x}
                    </li>
                  ))}
              </ul>
            </div>
          </section>

          <section className={styles.grid2}>
            <div className={styles.infoCard}>
              <div className={styles.infoTitle}>Contato</div>
              <div className={styles.contactRow}>
                <div className={styles.contactItem}>
                  <div className={styles.contactLabel}>Telefone</div>
                  <div className={styles.contactValue}>{a.phone || "(00) 00000-0000"}</div>
                </div>

                <div className={styles.contactItem}>
                  <div className={styles.contactLabel}>Instagram</div>
                  <div className={styles.contactValue}>{a.instagram || "@arena"}</div>
                </div>
              </div>

              {a.mapsUrl ? (
                <a className={styles.mapLink} href={a.mapsUrl} target="_blank" rel="noreferrer">
                  Abrir no mapa ↗
                </a>
              ) : (
                <div className={styles.mapHint}>💡 Depois você pode colocar o link do Google Maps aqui.</div>
              )}
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoTitle}>Galeria</div>
              <div className={styles.gallery}>
                {(a.gallery || []).length ? (
                  a.gallery.slice(0, 6).map((url, i) => (
                    <img key={url + i} className={styles.galleryImg} src={url} alt={`Foto ${i + 1}`} />
                  ))
                ) : (
                  <>
                    <div className={styles.galleryPh}>📸</div><div className={styles.galleryPh}>📸</div><div className={styles.galleryPh}>📸</div>
                    <div className={styles.galleryPh}>📸</div><div className={styles.galleryPh}>📸</div><div className={styles.galleryPh}>📸</div>
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}

      {/* ===== EVENTOS (CALENDÁRIO) ===== */}
      {tab === "events" ? (
        <section className={styles.eventsCalWrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionTitle}>Calendário de Eventos</div>
              <div className={styles.sectionSub}>Selecione um dia para ver os eventos oficiais da arena.</div>
            </div>

            <button type="button" className={styles.smallBtn} disabled title="Em breve (painel do dono)">
              + Criar evento
            </button>
          </div>

          <div className={styles.calHeader}>
            <button type="button" className={styles.calNavBtn} onClick={() => goMonth(-1)} aria-label="Mês anterior">
              ←
            </button>

            <div className={styles.calTitle}>{monthLabel(monthCursor)}</div>

            <button type="button" className={styles.calNavBtn} onClick={() => goMonth(1)} aria-label="Próximo mês">
              →
            </button>
          </div>

          <div className={styles.calWeekdays}>
            {weekdayShorts().map((w) => (
              <div key={w} className={styles.calW}>{w}</div>
            ))}
          </div>

          <div className={styles.calGrid}>
            {calendarCells.map((d) => {
              const iso = toISODate(d);
              const inMonth = isSameMonth(d, monthCursor);
              const hasEvents = (eventsByDate.get(iso) || []).length > 0;
              const selected = iso === selectedDayISO;
              const today = isTodayISO(iso);

              return (
                <button
                  key={iso}
                  type="button"
                  className={cx(
                    styles.calCell,
                    !inMonth && styles.calCellOut,
                    selected && styles.calCellActive,
                    today && styles.calCellToday
                  )}
                  onClick={() => setSelectedDayISO(iso)}
                >
                  <div className={styles.calDayTop}>
                    <span className={styles.calDayNum}>{d.getDate()}</span>
                    {hasEvents ? <span className={styles.calDot} /> : <span className={styles.calDotGhost} />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className={styles.dayPanel}>
            <div className={styles.dayPanelHead}>
              <div className={styles.dayPanelTitle}>
                Eventos do dia <b>{selectedDayISO}</b>
              </div>
              <div className={styles.dayPanelHint}>
                {selectedDayEvents.length ? `${selectedDayEvents.length} evento(s)` : "Nenhum evento"}
              </div>
            </div>

            {selectedDayEvents.length ? (
              <div className={styles.eventList}>
                {selectedDayEvents.map((ev) => (
                  <article key={ev.id} className={styles.eventRow}>
                    <div className={styles.eventTime}>
                      <div className={styles.eventHour}>{ev.timeFrom || "--:--"}</div>
                      <div className={styles.eventHourSub}>{ev.timeTo ? `até ${ev.timeTo}` : ""}</div>
                    </div>

                    <div className={styles.eventBody}>
                      <div className={styles.eventName}>{ev.title || "Evento"}</div>
                      <div className={styles.eventMetaLine}>
                        {ev.sport ? <span className={styles.eventPill}>⚽ {ev.sport}</span> : null}
                        {typeof ev.price !== "undefined" ? (
                          <span className={styles.eventPill}>💸 {Number(ev.price) ? formatMoneyBRL(ev.price) : "Grátis"}</span>
                        ) : null}
                        {ev.status ? <span className={styles.eventPillAlt}>{String(ev.status).toUpperCase()}</span> : null}
                      </div>
                      {ev.description ? <div className={styles.eventDesc}>{ev.description}</div> : null}
                    </div>

                    <button
                      type="button"
                      className={styles.eventAction}
                      onClick={() => nav(`/app/arena/${arenaId}/event/${ev.id}`)}
                    >
                      Ver
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptySmall}>
                <div className={styles.emptySmallIcon}>📅</div>
                <div className={styles.emptySmallTitle}>Nada por aqui</div>
                <div className={styles.emptySmallSub}>O dono da arena ainda não publicou eventos nesse dia.</div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === "live" ? (
        <section className={styles.placeholder}>
          <div className={styles.phIcon}>📡</div>
          <div className={styles.phTitle}>Ao vivo</div>
          <div className={styles.phSub}>No futuro: jogos rolando agora, placares e status das quadras.</div>
        </section>
      ) : null}

      {tab === "spots" ? (
        <section className={styles.placeholder}>
          <div className={styles.phIcon}>👥</div>
          <div className={styles.phTitle}>Vagas</div>
          <div className={styles.phSub}>No futuro: lista de peladas com vagas abertas dentro desta arena.</div>
        </section>
      ) : null}
    </div>
  );
}
