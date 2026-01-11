import { useEffect, useMemo, useState } from "react";
import styles from "./ArenaAgenda.module.css";

function formatDateBR(date) {
  try {
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

function toISODateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function clampStr(v) {
  return String(v || "").trim();
}

function moneyBRL(value) {
  const n = Number(value || 0);
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}

const HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

export default function ArenaAgenda({
  user,
  courts = [],
  initialCourtId = null,
  onBack,
  onOpenFinance,
  onOpenPromotions,
  onOpenCourtSettings,
}) {
  const safeUser = user || { name: "Arena Owner", role: "arena_owner" };

  // ---------------------------
  // Estado: dia e quadra
  // ---------------------------
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => {
    const base = new Date(today);
    base.setHours(0, 0, 0, 0);
    return [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(base, i));
  }, [today]);

  const day0ISO = useMemo(() => toISODateOnly(days[0]), [days]);

  const defaultCourtId = useMemo(() => {
    const list = Array.isArray(courts) ? courts : [];
    if (list.length === 0) return "";
    const active = list.find((c) => c?.isActive !== false);
    return String((active || list[0])?.id || "");
  }, [courts]);

  const [courtId, setCourtId] = useState(String(initialCourtId || defaultCourtId || ""));
  const [dayISO, setDayISO] = useState(day0ISO);
  const [query, setQuery] = useState("");

  // ✅ sincroniza courtId quando:
  // - initialCourtId mudar
  // - courts carregar e o courtId ficar inválido
  useEffect(() => {
    const list = Array.isArray(courts) ? courts : [];
    if (list.length === 0) {
      if (courtId) setCourtId("");
      return;
    }

    // 1) se veio initialCourtId válido, prioriza ele
    if (initialCourtId) {
      const exists = list.some((c) => String(c?.id) === String(initialCourtId));
      if (exists && String(courtId) !== String(initialCourtId)) {
        setCourtId(String(initialCourtId));
        return;
      }
    }

    // 2) se o courtId atual não existe mais, usa default
    const currentExists = list.some((c) => String(c?.id) === String(courtId));
    if (!currentExists) {
      setCourtId(defaultCourtId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCourtId, courts, defaultCourtId]);

  // ---------------------------
  // Reservas / Bloqueios fake
  // ---------------------------
  const [items, setItems] = useState(() => {
    // seed fake inicial (somente demo)
    const seed = [];
    const firstId = defaultCourtId;

    if (firstId) {
      seed.push({
        id: "seed-1",
        kind: "booking", // booking | block
        courtId: firstId,
        dayISO: day0ISO,
        hour: "19:00",
        title: "Reserva (App)",
        price: 180,
        status: "CONFIRMED", // CONFIRMED | PENDING | CANCELED
        customer: { name: "Carlos", phone: "41 99999-1111" },
      });

      seed.push({
        id: "seed-2",
        kind: "block",
        courtId: firstId,
        dayISO: day0ISO,
        hour: "21:00",
        title: "Manutenção",
        price: 0,
        status: "BLOCKED",
        customer: null,
      });
    }
    return seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // ---------------------------
  // Modal simple (inline)
  // ---------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("booking"); // booking | block
  const [modalHour, setModalHour] = useState("");
  const [form, setForm] = useState({
    title: "",
    price: "",
    customerName: "",
    customerPhone: "",
  });

  function openModal(hour, mode) {
    if (!courtId) return; // sem quadra não abre modal
    setModalHour(hour);
    setModalMode(mode);
    setForm({
      title: mode === "block" ? "Bloqueio" : "Reserva Manual",
      price: mode === "block" ? "" : "",
      customerName: "",
      customerPhone: "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalHour("");
  }

  function saveModal() {
    if (!courtId || !dayISO || !modalHour) return;

    const title = clampStr(form.title) || (modalMode === "block" ? "Bloqueio" : "Reserva");
    const price = modalMode === "block" ? 0 : Number(form.price || 0);

    const newItem = {
      id: `local-${Date.now()}`,
      kind: modalMode,
      courtId,
      dayISO,
      hour: modalHour,
      title,
      price,
      status: modalMode === "block" ? "BLOCKED" : "PENDING",
      customer:
        modalMode === "block"
          ? null
          : {
              name: clampStr(form.customerName) || "Cliente",
              phone: clampStr(form.customerPhone) || "",
            },
    };

    setItems((prev) => [...prev, newItem]);
    closeModal();
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function toggleCancel(id) {
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        if (x.kind !== "booking") return x;
        const nextStatus = x.status === "CANCELED" ? "CONFIRMED" : "CANCELED";
        return { ...x, status: nextStatus };
      })
    );
  }

  // ---------------------------
  // Derivados
  // ---------------------------
  const selectedCourt = useMemo(() => {
    const list = Array.isArray(courts) ? courts : [];
    return list.find((c) => String(c?.id) === String(courtId)) || null;
  }, [courts, courtId]);

  const dayLabel = useMemo(() => {
    const d = days.find((x) => toISODateOnly(x) === dayISO);
    return d ? formatDateBR(d) : dayISO;
  }, [days, dayISO]);

  const filteredCourtList = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return courts;

    return (courts || []).filter((c) =>
      String(c?.name || "").toLowerCase().includes(q)
    );
  }, [courts, query]);

  const mapByHour = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      if (String(it.courtId) !== String(courtId)) continue;
      if (it.dayISO !== dayISO) continue;
      map.set(it.hour, it);
    }
    return map;
  }, [items, courtId, dayISO]);

  const hasCourts = (courts || []).length > 0;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => onBack?.()}>
          ←
        </button>

        <div className={styles.headText}>
          <div className={styles.title}>Agenda da Arena</div>
          <div className={styles.sub}>
            {safeUser?.name ? `Olá, ${safeUser.name}` : "Olá"} • {dayLabel}
          </div>
        </div>

        <div className={styles.headActions}>
          <button type="button" className={styles.ghostBtn} onClick={() => onOpenPromotions?.()}>
            🏷️ Promoções
          </button>
          <button type="button" className={styles.ghostBtn} onClick={() => onOpenFinance?.()}>
            💰 Financeiro
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => onOpenCourtSettings?.()}>
            🏟️ Quadras
          </button>
        </div>
      </div>

      {/* Empty state (sem quadras) */}
      {!hasCourts ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyCard}>
            <div className={styles.emptyTitle}>Nenhuma quadra cadastrada</div>
            <div className={styles.emptySub}>
              Para usar a agenda, você precisa cadastrar pelo menos 1 quadra.
            </div>

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onOpenCourtSettings?.()}
            >
              🏟️ Cadastrar / Gerenciar Quadras
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.search}
                placeholder="Buscar quadra..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className={styles.selectRow}>
              <label className={styles.label}>
                Quadra
                <select
                  className={styles.select}
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                >
                  {filteredCourtList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c?.name || "Quadra"}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Dia
                <select
                  className={styles.select}
                  value={dayISO}
                  onChange={(e) => setDayISO(e.target.value)}
                >
                  {days.map((d) => {
                    const iso = toISODateOnly(d);
                    return (
                      <option key={iso} value={iso}>
                        {formatDateBR(d)}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
          </div>

          {/* Court summary */}
          <div className={styles.summary}>
            <div className={styles.summaryLeft}>
              <div className={styles.summaryName}>{selectedCourt?.name || "Quadra"}</div>
              <div className={styles.summaryMeta}>
                <span className={styles.chip}>
                  📍 {selectedCourt?.address || "Endereço não informado"}
                </span>
                <span className={styles.chip}>
                  🕒{" "}
                  {selectedCourt?.pricePerHour
                    ? moneyBRL(selectedCourt.pricePerHour)
                    : "R$ —"}
                  /h
                </span>
              </div>
            </div>

            <div className={styles.summaryRight}>
              <span className={styles.legend}>
                <span className={`${styles.dot} ${styles.free}`} /> Livre
              </span>
              <span className={styles.legend}>
                <span className={`${styles.dot} ${styles.booked}`} /> Reservado
              </span>
              <span className={styles.legend}>
                <span className={`${styles.dot} ${styles.blocked}`} /> Bloqueado
              </span>
              <span className={styles.legend}>
                <span className={`${styles.dot} ${styles.canceled}`} /> Cancelado
              </span>
            </div>
          </div>

          {/* Grid */}
          <div className={styles.grid}>
            {HOURS.map((h) => {
              const it = mapByHour.get(h) || null;

              const status = !it
                ? "free"
                : it.kind === "block"
                ? "blocked"
                : it.status === "CANCELED"
                ? "canceled"
                : it.status === "PENDING"
                ? "pending"
                : "booked";

              return (
                <div key={h} className={`${styles.slot} ${styles[status]}`}>
                  <div className={styles.slotTop}>
                    <div className={styles.hour}>{h}</div>

                    {!it ? (
                      <div className={styles.slotActions}>
                        <button
                          type="button"
                          className={styles.slotBtn}
                          onClick={() => openModal(h, "booking")}
                        >
                          + Reserva
                        </button>
                        <button
                          type="button"
                          className={styles.slotBtnGhost}
                          onClick={() => openModal(h, "block")}
                        >
                          ⛔ Bloquear
                        </button>
                      </div>
                    ) : (
                      <div className={styles.slotActions}>
                        {it.kind === "booking" ? (
                          <>
                            <button
                              type="button"
                              className={styles.slotBtnGhost}
                              onClick={() => toggleCancel(it.id)}
                            >
                              {it.status === "CANCELED" ? "↩ Reativar" : "✖ Cancelar"}
                            </button>
                            <button
                              type="button"
                              className={styles.slotBtnDanger}
                              onClick={() => removeItem(it.id)}
                            >
                              🗑
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.slotBtnGhost}
                            onClick={() => removeItem(it.id)}
                          >
                            🔓 Desbloquear
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.slotBody}>
                    {!it ? (
                      <div className={styles.freeText}>Livre</div>
                    ) : (
                      <>
                        <div className={styles.itemTitle}>
                          {it.kind === "block" ? "⛔" : "✅"} {it.title}
                        </div>

                        {it.kind === "booking" ? (
                          <div className={styles.itemMeta}>
                            <span className={styles.metaPill}>
                              {it.status === "PENDING"
                                ? "⏳ Pendente"
                                : it.status === "CANCELED"
                                ? "🚫 Cancelado"
                                : "✅ Confirmado"}
                            </span>

                            <span className={styles.metaPill}>
                              💸 {it.price ? moneyBRL(it.price) : "—"}
                            </span>

                            <span className={styles.metaPill}>
                              👤 {it.customer?.name || "Cliente"}
                            </span>

                            {it.customer?.phone ? (
                              <span className={styles.metaPill}>📱 {it.customer.phone}</span>
                            ) : null}
                          </div>
                        ) : (
                          <div className={styles.itemMeta}>
                            <span className={styles.metaPill}>🔧 Motivo: {it.title}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal inline */}
      {modalOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <div className={styles.modalTitle}>
                {modalMode === "block" ? "⛔ Bloquear Horário" : "➕ Criar Reserva"} • {modalHour}
              </div>
              <button type="button" className={styles.modalClose} onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.label}>
                Título
                <input
                  className={styles.input}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder={modalMode === "block" ? "Ex: Manutenção" : "Ex: Reserva Manual"}
                />
              </label>

              {modalMode === "booking" ? (
                <>
                  <div className={styles.row2}>
                    <label className={styles.label}>
                      Preço (R$)
                      <input
                        className={styles.input}
                        value={form.price}
                        onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                        placeholder="Ex: 180"
                        inputMode="numeric"
                      />
                    </label>

                    <label className={styles.label}>
                      Cliente
                      <input
                        className={styles.input}
                        value={form.customerName}
                        onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                        placeholder="Nome"
                      />
                    </label>
                  </div>

                  <label className={styles.label}>
                    Telefone (opcional)
                    <input
                      className={styles.input}
                      value={form.customerPhone}
                      onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
                      placeholder="(xx) xxxxx-xxxx"
                    />
                  </label>

                  <div className={styles.hint}>
                    * Reserva manual entra como <b>Pendente</b> (depois vira Confirmada quando o pagamento for ok).
                  </div>
                </>
              ) : (
                <div className={styles.hint}>
                  * Bloqueio impede reservas nesse horário (manutenção, evento, feriado, etc.).
                </div>
              )}
            </div>

            <div className={styles.modalFoot}>
              <button type="button" className={styles.ghostBtn} onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className={styles.primaryBtn} onClick={saveModal}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
