import { useEffect, useMemo, useRef, useState } from "react";
import { listCourts, listPresence } from "../../../services/publicCourtsMock";

/* =========================================================
   LiveNow — Praças Ao Vivo (Clean UI + Filtros Dropdown)
   - Header forte + voltar
   - Busca + botão “Filtros” (abre painel recolhível)
   - Filtros: min live / esporte / cidade / ordenação
   - Cards ricos com CTA "Abrir"
   - Estados vazios bonitos
   ========================================================= */

function cardStyle() {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "var(--shadow-sm)",
  };
}

function softCardStyle() {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    borderRadius: 16,
    padding: 12,
  };
}

function inputStyle() {
  return {
    width: "100%",
    borderRadius: 14,
    padding: "12px 12px",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    outline: "none",
    color: "var(--text)",
  };
}

function btnStyle(kind = "primary") {
  const base = {
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 1000,
    border: "1px solid var(--border)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  if (kind === "primary") {
    return {
      ...base,
      background: "var(--primary)",
      borderColor: "transparent",
      color: "white",
    };
  }

  if (kind === "soft") {
    return { ...base, background: "var(--surface-2)", color: "var(--text)" };
  }

  if (kind === "ghost") {
    return { ...base, background: "var(--surface)", color: "var(--text)" };
  }

  return { ...base, background: "transparent", color: "var(--text)" };
}

function badgeStyle(kind = "muted") {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    fontWeight: 900,
    fontSize: 12,
    lineHeight: 1,
    color: "var(--text)",
  };

  if (kind === "live") {
    return {
      ...base,
      borderColor: "rgba(24,195,126,.35)",
      background: "rgba(24,195,126,.12)",
    };
  }

  if (kind === "info") {
    return {
      ...base,
      borderColor: "rgba(141,164,255,.35)",
      background: "rgba(141,164,255,.12)",
    };
  }

  if (kind === "warn") {
    return {
      ...base,
      borderColor: "rgba(255,193,7,.35)",
      background: "rgba(255,193,7,.12)",
    };
  }

  return base;
}

function clampTextStyle(lines = 2) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: String(lines),
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

function normalizeText(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sportIcon(sports = []) {
  const s = (sports || []).map((x) => String(x || "").toLowerCase());
  if (s.some((x) => x.includes("basq"))) return "🏀";
  if (s.some((x) => x.includes("vô") || x.includes("volei") || x.includes("vôlei"))) return "🏐";
  if (s.some((x) => x.includes("skate"))) return "🛹";
  if (s.some((x) => x.includes("tenis") || x.includes("tênis"))) return "🎾";
  if (s.some((x) => x.includes("fut"))) return "⚽";
  return "🏟️";
}

function guessBairro(court) {
  if (court?.bairro) return String(court.bairro);
  const addr = String(court?.address || "");
  const dash = addr.split(" - ").map((x) => x.trim()).filter(Boolean);
  if (dash.length >= 2) return dash[dash.length - 1];
  const comma = addr.split(",").map((x) => x.trim()).filter(Boolean);
  if (comma.length >= 2) return comma[0];
  return "";
}

function sectionTitleStyle() {
  return {
    fontWeight: 1000,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  };
}

export default function LiveNow({ onOpenCourt, onBack }) {
  const [courts, setCourts] = useState([]);
  const [tick, setTick] = useState(0);

  // UI
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // filtros (dentro do dropdown)
  const [sport, setSport] = useState("all");
  const [minLive, setMinLive] = useState(1); // 1 / 3 / 5
  const [city, setCity] = useState("all");
  const [sort, setSort] = useState("most"); // most | az

  const listRef = useRef(null);

  useEffect(() => {
    setCourts(listCourts());

    // “realtime fake” (poll) — depois vira realtime do backend
    const t = setInterval(() => setTick((x) => x + 1), 1500);
    return () => clearInterval(t);
  }, []);

  const sportOptions = useMemo(() => {
    const set = new Set();
    for (const c of courts) for (const s of c.sports || []) set.add(String(s).toLowerCase());
    const arr = Array.from(set);
    arr.sort();
    return ["all", ...arr];
  }, [courts]);

  const cityOptions = useMemo(() => {
    const set = new Set();
    for (const c of courts) if (c.city) set.add(String(c.city).trim());
    const arr = Array.from(set).filter(Boolean);
    arr.sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...arr];
  }, [courts]);

  const totalLiveNow = useMemo(() => {
    return courts
      .map((c) => ({ id: c.id, n: listPresence(c.id).length }))
      .filter((x) => x.n > 0).length;
  }, [courts, tick]);

  const totalPeopleNow = useMemo(() => {
    return courts.reduce((acc, c) => acc + (listPresence(c.id).length || 0), 0);
  }, [courts, tick]);

  const liveList = useMemo(() => {
    const nq = normalizeText(q);

    const arr = courts
      .map((c) => {
        const presence = listPresence(c.id);
        const liveCount = presence.length;

        const bairro = guessBairro(c);

        return {
          ...c,
          liveCount,
          bairro,
          _search: normalizeText(
            `${c.name || ""} ${c.address || ""} ${c.city || ""} ${bairro || ""} ${(c.sports || []).join(" ")}`
          ),
        };
      })
      .filter((c) => c.liveCount >= minLive)
      .filter((c) => {
        if (sport !== "all") {
          const sports = Array.isArray(c.sports) ? c.sports : [];
          if (!sports.some((s) => String(s).toLowerCase() === sport)) return false;
        }
        if (city !== "all") {
          if (String(c.city || "").trim() !== String(city).trim()) return false;
        }
        if (nq && !c._search.includes(nq)) return false;
        return true;
      });

    arr.sort((a, b) => {
      if (sort === "az") return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
      if (b.liveCount !== a.liveCount) return b.liveCount - a.liveCount;
      return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
    });

    return arr;
  }, [courts, tick, q, sport, minLive, city, sort]);

  const topLive = useMemo(() => liveList.slice(0, 3), [liveList]);

  function handleBack() {
    if (typeof onBack === "function") return onBack();
    try {
      if (window?.history?.length > 1) window.history.back();
    } catch {
      // noop
    }
  }

  function clearFilters() {
    setQ("");
    setSport("all");
    setMinLive(1);
    setCity("all");
    setSort("most");
    setFiltersOpen(false);
    const el = listRef.current;
    if (el) el.scrollTop = 0;
  }

  function openCourtSafe(id) {
    if (!id) return;
    if (typeof onOpenCourt === "function") onOpenCourt(id);
  }

  const hasFiltersOn =
    Boolean(q) || sport !== "all" || minLive !== 1 || city !== "all" || sort !== "most";

  const activeCount = useMemo(() => {
    let n = 0;
    if (q) n++;
    if (sport !== "all") n++;
    if (minLive !== 1) n++;
    if (city !== "all") n++;
    if (sort !== "most") n++;
    return n;
  }, [q, sport, minLive, city, sort]);

  const filtersPanelStyle = useMemo(() => {
    const maxH = filtersOpen ? 380 : 0;
    const op = filtersOpen ? 1 : 0;
    const mt = filtersOpen ? 10 : 0;

    return {
      maxHeight: maxH,
      opacity: op,
      marginTop: mt,
      overflow: "hidden",
      transition: "max-height 220ms ease, opacity 180ms ease, margin-top 180ms ease",
    };
  }, [filtersOpen]);

  function LiveCard({ c }) {
    const icon = sportIcon(c.sports);
    const cityText = c.city ? String(c.city) : "";
    const bairroText = c.bairro ? String(c.bairro) : "";
    const placeLine = [bairroText, cityText].filter(Boolean).join(" • ");

    return (
      <div style={softCardStyle()}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "var(--bg-3)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              fontSize: 22,
              fontWeight: 1000,
            }}
            aria-hidden="true"
          >
            {c.imageUrl ? (
              <img src={c.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              icon
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 1000, fontSize: 15, ...clampTextStyle(1) }}>{c.name}</div>
              <span style={badgeStyle("live")}>🟢 {c.liveCount} agora</span>
            </div>

            <div style={{ opacity: 0.78, marginTop: 6, fontSize: 13, ...clampTextStyle(2) }}>
              {c.address || "Endereço não informado"}
            </div>

            {placeLine ? <div style={{ opacity: 0.7, marginTop: 6, fontSize: 12 }}>{placeLine}</div> : null}

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={badgeStyle("info")}>
                {sportIcon(c.sports)} {(c.sports || [])[0] || "Esportes"}
              </span>

              {(c.sports || []).slice(1, 3).map((s) => (
                <span key={s} style={badgeStyle()}>
                  {s}
                </span>
              ))}

              {(c.sports || []).length > 3 ? <span style={badgeStyle()}>+{(c.sports || []).length - 3}</span> : null}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={btnStyle("primary")} onClick={() => openCourtSafe(c.id)}>
                Abrir praça →
              </button>
              <button type="button" style={btnStyle("ghost")} onClick={() => openCourtSafe(c.id)}>
                Ver detalhes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      {/* HEADER TOP */}
      <div style={{ ...cardStyle(), padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 240 }}>
            <div style={{ fontWeight: 1000, fontSize: 16 }}>🟢 Ao vivo agora</div>
            <div style={{ opacity: 0.78, marginTop: 6, lineHeight: 1.35 }}>
              Só praças com gente marcada agora. Abra para fazer check-in, conversar e compartilhar.
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={badgeStyle("live")}>🟢 {totalLiveNow} praças ao vivo</span>
              <span style={badgeStyle()}>👥 {totalPeopleNow} pessoas</span>
              <span style={badgeStyle("info")}>⚡ atualiza automático</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" style={btnStyle("ghost")} onClick={handleBack}>
              ← Voltar
            </button>
            <button
              type="button"
              style={btnStyle("soft")}
              onClick={() => setTick((x) => x + 1)}
              title="Forçar atualização agora"
            >
              ↻ Atualizar
            </button>
          </div>
        </div>

        {/* BUSCA + AÇÕES */}
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            style={inputStyle()}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar praça, bairro, cidade, esporte…"
          />

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                style={btnStyle("soft")}
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                🎛️ Filtros {activeCount ? `(${activeCount})` : ""}{" "}
                <span style={{ opacity: 0.85 }}>{filtersOpen ? "▲" : "▼"}</span>
              </button>

              {hasFiltersOn ? (
                <button type="button" style={btnStyle("ghost")} onClick={clearFilters}>
                  ✖ Limpar
                </button>
              ) : null}
            </div>

            <div style={{ opacity: 0.78, fontSize: 13 }}>
              {liveList.length} praças • min {minLive}+
            </div>
          </div>

          {/* PAINEL RECOLHÍVEL */}
          <div style={filtersPanelStyle}>
            <div style={{ ...softCardStyle(), padding: 14 }}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={sectionTitleStyle()}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Filtros e ordenação</div>
                    <div style={{ opacity: 0.72, fontSize: 12, marginTop: 4 }}>
                      Ajuste e feche para ver a lista limpa.
                    </div>
                  </div>

                  <button type="button" style={btnStyle("ghost")} onClick={() => setFiltersOpen(false)}>
                    Fechar
                  </button>
                </div>

                {/* Min live */}
                <div>
                  <div style={{ opacity: 0.72, fontSize: 12, marginBottom: 6 }}>Mínimo ao vivo</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[1, 3, 5].map((n) => {
                      const on = minLive === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setMinLive(n)}
                          style={on ? btnStyle("primary") : btnStyle("ghost")}
                          title="Filtrar pelo mínimo de pessoas ao vivo"
                        >
                          🟢 {n}+
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Esporte + Cidade */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ opacity: 0.72, fontSize: 12, marginBottom: 6 }}>Esporte</div>
                    <select style={inputStyle()} value={sport} onChange={(e) => setSport(e.target.value)}>
                      {sportOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "all" ? "Todos" : opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ opacity: 0.72, fontSize: 12, marginBottom: 6 }}>Cidade (mock)</div>
                    <select style={inputStyle()} value={city} onChange={(e) => setCity(e.target.value)}>
                      {cityOptions.map((c) => (
                        <option key={c} value={c}>
                          {c === "all" ? "Todas" : c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ordenação */}
                <div>
                  <div style={{ opacity: 0.72, fontSize: 12, marginBottom: 6 }}>Ordenar por</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setSort("most")}
                      style={sort === "most" ? btnStyle("primary") : btnStyle("ghost")}
                    >
                      📈 Mais cheias
                    </button>
                    <button type="button" onClick={() => setSort("az")} style={sort === "az" ? btnStyle("primary") : btnStyle("ghost")}>
                      🔤 A–Z
                    </button>
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="button" style={btnStyle("soft")} onClick={() => setFiltersOpen(false)}>
                    ✅ Aplicar e fechar
                  </button>
                  {hasFiltersOn ? (
                    <button type="button" style={btnStyle("ghost")} onClick={clearFilters}>
                      ✖ Limpar filtros
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* DICA */}
          {hasFiltersOn ? (
            <div style={{ opacity: 0.7, fontSize: 12 }}>
              Dica: se sumiu tudo, volte o mínimo para <b>1+</b> e deixe esporte em <b>Todos</b>.
            </div>
          ) : null}
        </div>
      </div>

      {/* LISTA AO VIVO */}
      <div ref={listRef} style={{ display: "grid", gap: 10 }}>
        {liveList.length === 0 ? (
          <div style={cardStyle()}>
            <div style={{ fontWeight: 1000, fontSize: 15 }}>⚪ Nenhuma praça ao vivo com esses filtros</div>
            <div style={{ opacity: 0.78, marginTop: 6, lineHeight: 1.35 }}>
              Para “acender” uma praça: abra uma praça e faça check-in.
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={btnStyle("primary")} onClick={clearFilters}>
                Mostrar tudo ao vivo
              </button>
              <button type="button" style={btnStyle("ghost")} onClick={handleBack}>
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TOP */}
            <div style={cardStyle()}>
              <div style={sectionTitleStyle()}>
                <span>🔥 Top praças ao vivo</span>
                <span style={badgeStyle("live")}>Top {Math.min(3, topLive.length)}</span>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {topLive.map((c) => (
                  <div key={c.id} style={softCardStyle()}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div style={{ fontWeight: 1000, minWidth: 0, ...clampTextStyle(1) }}>{c.name}</div>
                      <span style={badgeStyle("live")}>🟢 {c.liveCount} agora</span>
                    </div>
                    <div style={{ opacity: 0.78, marginTop: 6, ...clampTextStyle(2) }}>{c.address || "—"}</div>
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" style={btnStyle("primary")} onClick={() => openCourtSafe(c.id)}>
                        Abrir →
                      </button>
                      <span style={badgeStyle("info")}>
                        {sportIcon(c.sports)} {(c.sports || [])[0] || "Esportes"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LISTA */}
            <div style={cardStyle()}>
              <div style={sectionTitleStyle()}>
                <span>📋 Lista ao vivo</span>
                <span style={badgeStyle("live")}>{liveList.length} praças</span>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {liveList.map((c) => (
                  <LiveCard key={c.id} c={c} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ opacity: 0.7, fontSize: 12, padding: "0 4px" }}>
        💡 Próximo upgrade: favoritar praça + notificar quando ficar ao vivo.
      </div>
    </div>
  );
}
