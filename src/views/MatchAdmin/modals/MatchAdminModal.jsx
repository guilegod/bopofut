import { useEffect, useMemo, useState } from "react";

export default function MatchAdminModal({
  match,
  courts,
  user,
  users,
  onClose,
  onSave,
}) {
  if (!match) return null;

  const isAdmin = user?.role === "owner" || user?.id === match.organizerId;
  if (!isAdmin) return null;

  const court = courts?.find((c) => c.id === match.courtId) || null;

  // Jogadores presentes na partida
  const players = useMemo(() => {
    const ids = match.currentPlayers || [];
    return ids
      .map((id) => users?.find((u) => u.id === id) || { id, name: id })
      .filter(Boolean);
  }, [match.currentPlayers, users]);

  // ==========================
  // 1) SÚMULA (gols/assists)
  // ==========================
  const [stats, setStats] = useState(() => {
    const base = match.playerStats || {};
    const next = { ...base };
    for (const p of players) {
      if (!next[p.id]) next[p.id] = { goals: 0, assists: 0 };
    }
    return next;
  });

  // ==========================
  // 2) DESTAQUES
  // ==========================
  const [highlights, setHighlights] = useState(() => match.highlights || []);

  // ==========================
  // 3) CONTROLE DE PARTIDA (status/tempo)
  // ==========================
  const [admin, setAdmin] = useState(() => {
    const base = match.admin || {};
    return {
      status: base.status || "SCHEDULED", // SCHEDULED | STARTED | FINISHED | CANCELLED
      plannedDurationMin: Number(base.plannedDurationMin ?? 60), // padrão 60
      startedAt: base.startedAt || null, // ISO string
      endedAt: base.endedAt || null, // ISO string
      delayMin: Number(base.delayMin ?? 0),
      notes: base.notes || "",
    };
  });

  // ==========================
  // 4) DISCIPLINA (cartões/eventos)
  // ==========================
  const [discipline, setDiscipline] = useState(() => {
    const base = match.discipline || {};
    const next = { ...base };

    for (const p of players) {
      if (!next[p.id]) {
        next[p.id] = { yellow: 0, red: 0, events: [] }; // events: [{type, minute, reason, at}]
      } else {
        // garante formato mínimo
        next[p.id] = {
          yellow: Number(next[p.id]?.yellow || 0),
          red: Number(next[p.id]?.red || 0),
          events: Array.isArray(next[p.id]?.events) ? next[p.id].events : [],
        };
      }
    }
    return next;
  });

  // formulário rápido para adicionar evento disciplinar
  const [eventDraft, setEventDraft] = useState(() => {
    const firstId = players?.[0]?.id || "";
    return { playerId: firstId, type: "YELLOW", minute: "", reason: "" };
  });

  // Mantém playerId válido quando lista mudar
  useEffect(() => {
    if (!players?.length) return;
    setEventDraft((prev) => ({
      ...prev,
      playerId: prev.playerId || players[0].id,
    }));
  }, [players]);

  // ==========================
  // Helpers
  // ==========================
  function nowISO() {
    return new Date().toISOString();
  }

  function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function minutesBetween(isoA, isoB) {
    if (!isoA || !isoB) return 0;
    const a = new Date(isoA).getTime();
    const b = new Date(isoB).getTime();
    const diff = Math.max(0, b - a);
    return Math.round(diff / 60000);
  }

  function formatLocal(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString();
  }

  function updatePlayer(pId, patch) {
    setStats((prev) => ({
      ...prev,
      [pId]: {
        goals: safeNum(prev?.[pId]?.goals, 0),
        assists: safeNum(prev?.[pId]?.assists, 0),
        ...patch,
      },
    }));
  }

  function toggleHighlight(pId) {
    setHighlights((prev) => {
      const exists = prev.some((h) => h.userId === pId);
      if (exists) return prev.filter((h) => h.userId !== pId);
      return [...prev, { userId: pId, label: "Destaque" }];
    });
  }

  // ==========================
  // Status/Tempo
  // ==========================
  function setStatus(nextStatus) {
    setAdmin((prev) => ({ ...prev, status: nextStatus }));
  }

  function startMatchNow() {
    setAdmin((prev) => ({
      ...prev,
      status: "STARTED",
      startedAt: prev.startedAt || nowISO(),
    }));
  }

  function finishMatchNow() {
    setAdmin((prev) => {
      const started = prev.startedAt || nowISO();
      return {
        ...prev,
        status: "FINISHED",
        startedAt: started,
        endedAt: prev.endedAt || nowISO(),
      };
    });
  }

  function cancelMatch() {
    setAdmin((prev) => ({ ...prev, status: "CANCELLED" }));
  }

  const playedMinutes = useMemo(
    () => minutesBetween(admin.startedAt, admin.endedAt),
    [admin.startedAt, admin.endedAt]
  );

  // ==========================
  // Disciplina (cartões/eventos)
  // ==========================
  function incCard(pId, type) {
    setDiscipline((prev) => {
      const cur = prev[pId] || { yellow: 0, red: 0, events: [] };
      const next = { ...prev };
      next[pId] = {
        ...cur,
        yellow: type === "YELLOW" ? cur.yellow + 1 : cur.yellow,
        red: type === "RED" ? cur.red + 1 : cur.red,
      };
      return next;
    });
  }

  function resetCards(pId) {
    setDiscipline((prev) => {
      const cur = prev[pId] || { yellow: 0, red: 0, events: [] };
      return { ...prev, [pId]: { ...cur, yellow: 0, red: 0 } };
    });
  }

  function addDisciplineEvent() {
    const pid = eventDraft.playerId;
    if (!pid) return;

    const type = eventDraft.type;
    const minute = String(eventDraft.minute || "").trim();
    const reason = String(eventDraft.reason || "").trim();

    // deixa reason opcional, mas pelo menos tipo/atleta
    setDiscipline((prev) => {
      const cur = prev[pid] || { yellow: 0, red: 0, events: [] };
      const nextEvents = [
        ...(cur.events || []),
        { type, minute: minute ? Number(minute) : null, reason, at: nowISO() },
      ];

      const next = { ...prev };
      next[pid] = {
        ...cur,
        yellow: type === "YELLOW" ? cur.yellow + 1 : cur.yellow,
        red: type === "RED" ? cur.red + 1 : cur.red,
        events: nextEvents,
      };
      return next;
    });

    setEventDraft((prev) => ({ ...prev, minute: "", reason: "" }));
  }

  function removeEvent(pId, idx) {
    setDiscipline((prev) => {
      const cur = prev[pId];
      if (!cur?.events?.length) return prev;
      const nextEvents = cur.events.filter((_, i) => i !== idx);
      return { ...prev, [pId]: { ...cur, events: nextEvents } };
    });
  }

  // ==========================
  // Save
  // ==========================
  function handleSave() {
    // payload admin completo
    const payloadAdmin = {
      ...admin,
      plannedDurationMin: safeNum(admin.plannedDurationMin, 60),
      delayMin: safeNum(admin.delayMin, 0),
      // normaliza: se finalizou e não tinha endedAt, seta
      startedAt: admin.status !== "SCHEDULED" ? admin.startedAt : admin.startedAt,
      endedAt: admin.status === "FINISHED" ? admin.endedAt : admin.endedAt,
    };

    onSave(stats, highlights, payloadAdmin, discipline);
  }

  // ==========================
  // UI Styles (usa vars do theme quando existir)
  // ==========================
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 16,
  };

  const cardStyle = {
    width: "min(980px, 96vw)",
    background: "var(--bg-2, rgba(17,31,59,.92))",
    border: "1px solid var(--border, rgba(255,255,255,.12))",
    borderRadius: 18,
    padding: 18,
    color: "var(--text, #fff)",
  };

  const btn = {
    height: 40,
    borderRadius: 12,
    border: "1px solid var(--border, rgba(255,255,255,.18))",
    background: "transparent",
    color: "var(--text, #fff)",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 700,
  };

  const btnPrimary = {
    ...btn,
    background: "var(--accent-soft, rgba(217,77,43,.18))",
    borderColor: "var(--accent, rgba(217,77,43,.6))",
  };

  const btnSuccess = {
    ...btn,
    background: "var(--success-soft, rgba(45,90,39,.25))",
    borderColor: "var(--success, rgba(45,90,39,.85))",
  };

  const input = {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: "1px solid var(--border, rgba(255,255,255,.18))",
    background: "var(--surface, rgba(0,0,0,.18))",
    color: "var(--text, #fff)",
    padding: "0 10px",
    outline: "none",
  };

  const miniLabel = { opacity: 0.75, fontSize: 12, letterSpacing: ".08em" };
  const panel = {
    border: "1px solid var(--border, rgba(255,255,255,.12))",
    background: "var(--surface-2, rgba(255,255,255,.04))",
    borderRadius: 16,
    padding: 12,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={miniLabel}>ADMIN • PARTIDA</div>
            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>
              {match.title || court?.name || "Partida"}
            </div>
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              {match.date} • {match.time} • {court?.name || ""}
            </div>
          </div>

          <button type="button" onClick={onClose} style={btn}>
            ✕
          </button>
        </div>

        {/* TOP GRID */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1.1fr .9fr",
          }}
        >
          {/* STATUS / TEMPO */}
          <div style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={miniLabel}>STATUS</div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 6 }}>
                  {admin.status === "SCHEDULED"
                    ? "Agendada"
                    : admin.status === "STARTED"
                    ? "Iniciada"
                    : admin.status === "FINISHED"
                    ? "Finalizada"
                    : "Cancelada"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button type="button" style={btnSuccess} onClick={startMatchNow}>
                  Iniciar agora
                </button>
                <button type="button" style={btnPrimary} onClick={finishMatchNow}>
                  Finalizar agora
                </button>
                <button type="button" style={btn} onClick={cancelMatch}>
                  Cancelar
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gap: 10,
                gridTemplateColumns: "1fr 1fr 1fr",
              }}
            >
              <div>
                <div style={miniLabel}>Duração planejada (min)</div>
                <input
                  style={input}
                  type="number"
                  min="10"
                  value={admin.plannedDurationMin}
                  onChange={(e) =>
                    setAdmin((p) => ({ ...p, plannedDurationMin: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <div style={miniLabel}>Atraso (min)</div>
                <input
                  style={input}
                  type="number"
                  min="0"
                  value={admin.delayMin}
                  onChange={(e) =>
                    setAdmin((p) => ({ ...p, delayMin: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <div style={miniLabel}>Minutos jogados</div>
                <div
                  style={{
                    height: 40,
                    borderRadius: 12,
                    border: "1px solid var(--border, rgba(255,255,255,.18))",
                    background: "var(--surface, rgba(0,0,0,.18))",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                  }}
                >
                  {admin.status === "FINISHED" ? playedMinutes : "—"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={miniLabel}>Iniciou</div>
                  <div style={{ opacity: 0.9, marginTop: 4 }}>
                    {admin.startedAt ? formatLocal(admin.startedAt) : "—"}
                  </div>
                </div>
                <div>
                  <div style={miniLabel}>Terminou</div>
                  <div style={{ opacity: 0.9, marginTop: 4 }}>
                    {admin.endedAt ? formatLocal(admin.endedAt) : "—"}
                  </div>
                </div>
              </div>

              <div>
                <div style={miniLabel}>Observações da partida</div>
                <textarea
                  value={admin.notes}
                  onChange={(e) => setAdmin((p) => ({ ...p, notes: e.target.value }))}
                  style={{
                    ...input,
                    height: 84,
                    paddingTop: 10,
                    resize: "none",
                  }}
                  placeholder="Ex: atraso por chuva, bola estourou, discussão resolvida, etc."
                />
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={btn} onClick={() => setStatus("SCHEDULED")}>
                Marcar como Agendada
              </button>
              <button type="button" style={btn} onClick={() => setStatus("STARTED")}>
                Marcar como Iniciada
              </button>
              <button type="button" style={btn} onClick={() => setStatus("FINISHED")}>
                Marcar como Finalizada
              </button>
            </div>
          </div>

          {/* EVENTO DISCIPLINAR (rápido) */}
          <div style={panel}>
            <div style={miniLabel}>DISCIPLINA • ADICIONAR EVENTO</div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div>
                <div style={miniLabel}>Jogador</div>
                <select
                  style={input}
                  value={eventDraft.playerId}
                  onChange={(e) => setEventDraft((p) => ({ ...p, playerId: e.target.value }))}
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={miniLabel}>Tipo</div>
                  <select
                    style={input}
                    value={eventDraft.type}
                    onChange={(e) => setEventDraft((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="YELLOW">Amarelo</option>
                    <option value="RED">Vermelho</option>
                  </select>
                </div>

                <div>
                  <div style={miniLabel}>Minuto (opcional)</div>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    value={eventDraft.minute}
                    onChange={(e) => setEventDraft((p) => ({ ...p, minute: e.target.value }))}
                    placeholder="Ex: 12"
                  />
                </div>
              </div>

              <div>
                <div style={miniLabel}>Motivo (opcional)</div>
                <input
                  style={input}
                  type="text"
                  value={eventDraft.reason}
                  onChange={(e) => setEventDraft((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Ex: falta dura, reclamação, mão na bola…"
                />
              </div>

              <button type="button" style={btnPrimary} onClick={addDisciplineEvent}>
                Registrar cartão/evento
              </button>
            </div>
          </div>
        </div>

        {/* PLAYERS LIST */}
        <div style={{ marginTop: 14, ...panel }}>
          <div style={miniLabel}>JOGADORES • SÚMULA • DESTAQUE • CARTÕES</div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {players.map((p) => {
              const pStats = stats[p.id] || { goals: 0, assists: 0 };
              const isHighlight = highlights.some((h) => h.userId === p.id);

              const d = discipline[p.id] || { yellow: 0, red: 0, events: [] };

              return (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 110px 110px 130px 160px",
                    gap: 10,
                    alignItems: "center",
                    padding: 10,
                    borderRadius: 14,
                    border: "1px solid var(--border, rgba(255,255,255,.12))",
                    background: "var(--surface-2, rgba(255,255,255,.04))",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{p.name}</div>

                  <input
                    type="number"
                    min="0"
                    value={pStats.goals}
                    onChange={(e) => updatePlayer(p.id, { goals: Number(e.target.value) })}
                    placeholder="Gols"
                    style={input}
                  />

                  <input
                    type="number"
                    min="0"
                    value={pStats.assists}
                    onChange={(e) => updatePlayer(p.id, { assists: Number(e.target.value) })}
                    placeholder="Assists"
                    style={input}
                  />

                  <button
                    type="button"
                    onClick={() => toggleHighlight(p.id)}
                    style={{
                      ...btn,
                      borderColor: isHighlight
                        ? "var(--accent, rgba(217,77,43,.7))"
                        : "var(--border, rgba(255,255,255,.18))",
                      background: isHighlight
                        ? "var(--accent-soft, rgba(217,77,43,.18))"
                        : "transparent",
                    }}
                  >
                    {isHighlight ? "★ Destaque" : "☆ Destaque"}
                  </button>

                  {/* cartões rápidos */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button type="button" style={btn} onClick={() => incCard(p.id, "YELLOW")}>
                      🟨 {d.yellow}
                    </button>
                    <button type="button" style={btn} onClick={() => incCard(p.id, "RED")}>
                      🟥 {d.red}
                    </button>
                    <button type="button" style={btn} onClick={() => resetCards(p.id)}>
                      Reset
                    </button>
                  </div>

                  {/* eventos disciplinares do jogador */}
                  {d.events?.length ? (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        marginTop: 6,
                        paddingTop: 8,
                        borderTop: "1px dashed var(--border, rgba(255,255,255,.14))",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      {d.events.map((ev, idx) => (
                        <div
                          key={`${p.id}-${idx}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            opacity: 0.92,
                          }}
                        >
                          <div>
                            <strong style={{ marginRight: 8 }}>
                              {ev.type === "RED" ? "🟥" : "🟨"}
                            </strong>
                            {ev.minute != null ? `min ${ev.minute} • ` : ""}
                            {ev.reason ? ev.reason : "Evento registrado"}
                          </div>

                          <button
                            type="button"
                            style={{ ...btn, height: 32 }}
                            onClick={() => removeEvent(p.id, idx)}
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={btn}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave} style={{ ...btnSuccess, fontWeight: 900 }}>
            Salvar Admin
          </button>
        </div>
      </div>
    </div>
  );
}
