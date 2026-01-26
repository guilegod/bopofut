import { useEffect, useMemo, useRef, useState } from "react";
import { distanceMeters, listCourts, listPresence } from "../../../services/publicCourtsMock";

/* =========================================================
   CourtsHome — BopôFut Praças (Clean UI + Filtros Dropdown)
   - GPS opcional (não pede permissão sozinho)
   - Filtros recolhíveis (botão "Filtros")
   - Seções: Ao vivo / Perto de você / Populares
   - Cards ricos: ícone/foto, esportes, ao vivo, distância, CTA
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
    borderRadius: 18,
    padding: 14,
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

  if (kind === "ghost") {
    return { ...base, background: "var(--surface)", color: "var(--text)" };
  }

  if (kind === "soft") {
    return { ...base, background: "var(--surface-2)", color: "var(--text)" };
  }

  if (kind === "danger") {
    return {
      ...base,
      background: "var(--danger)",
      borderColor: "transparent",
      color: "white",
    };
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
    background: "var(--surface-2)",
    fontWeight: 900,
    fontSize: 12,
    color: "var(--text)",
  };

  if (kind === "live") {
    return {
      ...base,
      borderColor: "rgba(24,195,126,.35)",
      background: "rgba(24,195,126,.12)",
    };
  }

  if (kind === "gpsOn") {
    return {
      ...base,
      borderColor: "rgba(141,164,255,.40)",
      background: "rgba(141,164,255,.12)",
    };
  }

  if (kind === "gpsOff") {
    return { ...base, opacity: 0.85 };
  }

  if (kind === "active") {
    return {
      ...base,
      borderColor: "rgba(141,164,255,.35)",
      background: "rgba(141,164,255,.12)",
    };
  }

  return base;
}

function sectionTitleStyle() {
  return {
    fontWeight: 1000,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  };
}

function clampTextStyle(lines = 2) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: String(lines),
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
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

function computePopularityScore(court) {
  // mock determinístico (sem backend)
  const id = String(court?.id || "");
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i) * (i + 1);
  const base = (sum % 100) + 1; // 1..100
  const bonus = Math.min(15, (court?.sports?.length || 0) * 3);
  return base + bonus;
}

function normalizeText(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function formatDistance(distMeters) {
  if (distMeters == null) return "";
  const km = distMeters / 1000;
  if (km < 1) return `${Math.round(distMeters)} m`;
  return `${km.toFixed(1)} km`;
}

function countActiveFilters({ q, sport, onlyLive, radiusKm, city, bairro }) {
  let n = 0;
  if (q) n++;
  if (sport !== "all") n++;
  if (onlyLive) n++;
  if (radiusKm !== 5) n++;
  if (city !== "all") n++;
  if (bairro !== "all") n++;
  return n;
}

export default function SquaresHome({ user, onOpenCourt, onOpenLiveNow }) {
  const [courts, setCourts] = useState([]);
  const [tick, setTick] = useState(0);

  // ✅ GPS: não solicita automaticamente (modo demo)
  const [coords, setCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("demo"); // demo | on | off | loading
  const lastGeoReqAt = useRef(0);

  // Busca + filtros
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("all");
  const [onlyLive, setOnlyLive] = useState(false);

  // Raio (mock/funciona só com GPS)
  const [radiusKm, setRadiusKm] = useState(5); // 2 / 5 / 10

  // Cidade/Bairro (mock)
  const [city, setCity] = useState("all");
  const [bairro, setBairro] = useState("all");

  // ✅ UI: filtros recolhíveis
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setCourts(listCourts());

    // “realtime fake” para contador ao vivo (presença)
    const t = setInterval(() => setTick((x) => x + 1), 1500);
    return () => clearInterval(t);
  }, []);

  // =========================================================
  // ✅ GEOLOCALIZAÇÃO (OPCIONAL)
  // =========================================================
  function requestGps() {
    const now = Date.now();
    if (now - lastGeoReqAt.current < 1500) return;
    lastGeoReqAt.current = now;

    if (!navigator.geolocation) {
      setGpsStatus("off");
      setCoords(null);
      return;
    }

    setGpsStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("on");
      },
      () => {
        setCoords(null);
        setGpsStatus("off");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function disableGps() {
    setCoords(null);
    setGpsStatus("demo");
  }

  const sportOptions = useMemo(() => {
    const set = new Set();
    for (const c of courts) {
      for (const s of c.sports || []) set.add(String(s).toLowerCase());
    }
    const arr = Array.from(set);
    arr.sort();
    return ["all", ...arr];
  }, [courts]);

  const cityOptions = useMemo(() => {
    const set = new Set();
    for (const c of courts) {
      if (c.city) set.add(String(c.city).trim());
    }
    const arr = Array.from(set).filter(Boolean);
    arr.sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...arr];
  }, [courts]);

  const bairroOptions = useMemo(() => {
    const set = new Set();
    for (const c of courts) {
      const b = guessBairro(c);
      if (b) set.add(String(b).trim());
    }
    const arr = Array.from(set).filter(Boolean);
    arr.sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...arr];
  }, [courts]);

  const computed = useMemo(() => {
    const normalizedQ = normalizeText(q);

    const base = courts
      .map((c) => {
        const presence = listPresence(c.id);
        const liveCount = presence.length;

        const dist =
          coords && c.lat && c.lng
            ? distanceMeters(coords, { lat: c.lat, lng: c.lng })
            : null;

        const bairroGuess = guessBairro(c);

        return {
          ...c,
          liveCount,
          dist,
          bairroGuess,
          popularityScore: computePopularityScore(c),
          _search: normalizeText(
            `${c.name || ""} ${c.address || ""} ${c.city || ""} ${bairroGuess || ""} ${(c.sports || []).join(" ")}`
          ),
        };
      })
      .filter((c) => {
        if (sport !== "all") {
          const sports = Array.isArray(c.sports) ? c.sports : [];
          if (!sports.some((s) => String(s).toLowerCase() === sport)) return false;
        }

        if (onlyLive && (c.liveCount || 0) <= 0) return false;

        if (city !== "all") {
          if (String(c.city || "").trim() !== String(city).trim()) return false;
        }

        if (bairro !== "all") {
          const b = String(c.bairroGuess || "").trim();
          if (!b) return false;
          if (normalizeText(b) !== normalizeText(bairro)) return false;
        }

        if (normalizedQ) {
          if (!c._search.includes(normalizedQ)) return false;
        }

        // raio só se tiver coords + dist
        if (coords && radiusKm && c.dist != null) {
          const maxM = radiusKm * 1000;
          if (c.dist > maxM) return false;
        }

        return true;
      });

    return base;
  }, [courts, coords, q, sport, onlyLive, radiusKm, city, bairro, tick]);

  const liveItems = useMemo(() => computed.filter((c) => (c.liveCount || 0) > 0), [computed]);

  const nearItems = useMemo(() => {
    const arr = [...computed];
    arr.sort((a, b) => {
      if (coords) {
        if (a.dist == null && b.dist != null) return 1;
        if (a.dist != null && b.dist == null) return -1;
        if (a.dist != null && b.dist != null && a.dist !== b.dist) return a.dist - b.dist;
      }
      if ((b.liveCount || 0) !== (a.liveCount || 0)) return (b.liveCount || 0) - (a.liveCount || 0);
      return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
    });
    return arr;
  }, [computed, coords]);

  const popularItems = useMemo(() => {
    const arr = [...courts]
      .map((c) => {
        const presence = listPresence(c.id);
        const liveCount = presence.length;
        const dist =
          coords && c.lat && c.lng
            ? distanceMeters(coords, { lat: c.lat, lng: c.lng })
            : null;

        return {
          ...c,
          liveCount,
          dist,
          popularityScore: computePopularityScore(c),
          bairroGuess: guessBairro(c),
        };
      })
      .sort((a, b) => b.popularityScore - a.popularityScore);
    return arr;
  }, [courts, coords, tick]);

  const gpsLabel = useMemo(() => {
    if (gpsStatus === "loading") return "GPS: verificando…";
    if (gpsStatus === "on") return "GPS: ligado (precisão real)";
    if (gpsStatus === "off") return "GPS: negado/indisponível";
    return "GPS: desligado (modo demo)";
  }, [gpsStatus]);

  const hasFiltersOn = Boolean(q) || sport !== "all" || onlyLive || radiusKm !== 5 || city !== "all" || bairro !== "all";

  const activeFiltersCount = useMemo(
    () => countActiveFilters({ q, sport, onlyLive, radiusKm, city, bairro }),
    [q, sport, onlyLive, radiusKm, city, bairro]
  );

  function clearFilters() {
    setQ("");
    setSport("all");
    setOnlyLive(false);
    setRadiusKm(5);
    setCity("all");
    setBairro("all");
  }

  function openCourtSafe(id) {
    if (!id) return;
    if (typeof onOpenCourt === "function") onOpenCourt(id);
  }

  function openLiveSafe() {
    if (typeof onOpenLiveNow === "function") onOpenLiveNow();
  }

  function CourtRichCard({ c }) {
    const isLive = (c.liveCount || 0) > 0;
    const icon = sportIcon(c.sports);
    const cityText = c.city ? String(c.city) : "";
    const bairroText = c.bairroGuess ? String(c.bairroGuess) : "";
    const placeLine = [bairroText, cityText].filter(Boolean).join(" • ");

    return (
      <div style={{ ...softCardStyle(), padding: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 52,
              height: 52,
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
              <div style={badgeStyle(isLive ? "live" : "muted")}>
                {isLive ? `🟢 ${c.liveCount} agora` : "⚪ vazia"}
              </div>
            </div>

            <div style={{ opacity: 0.78, marginTop: 6, fontSize: 13, ...clampTextStyle(2) }}>
              {c.address || "Endereço não informado"}
            </div>

            {placeLine ? <div style={{ opacity: 0.70, marginTop: 6, fontSize: 12 }}>{placeLine}</div> : null}

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {(c.sports || []).slice(0, 3).map((s) => (
                <span key={s} style={badgeStyle()}>{s}</span>
              ))}

              {coords && c.dist != null ? (
                <span style={badgeStyle()}>📍 {formatDistance(c.dist)}</span>
              ) : (
                <span style={{ ...badgeStyle(), opacity: 0.75 }}>📍 distância (demo)</span>
              )}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={btnStyle("primary")} onClick={() => openCourtSafe(c.id)}>
                Abrir praça →
              </button>

              <button
                type="button"
                style={btnStyle("ghost")}
                onClick={() => {
                  if (!coords && gpsStatus !== "loading") requestGps();
                  openCourtSafe(c.id);
                }}
              >
                Ver detalhes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtersPanelStyle = useMemo(() => {
    // colapsável “bonito” sem libs
    const maxH = filtersOpen ? 360 : 0;
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

  const filtersSummary = useMemo(() => {
    const items = [];
    if (onlyLive) items.push("Ao vivo");
    if (sport !== "all") items.push(`Esporte: ${sport}`);
    if (radiusKm !== 5) items.push(`Raio: ${radiusKm}km`);
    if (city !== "all") items.push(`Cidade: ${city}`);
    if (bairro !== "all") items.push(`Bairro: ${bairro}`);
    return items;
  }, [onlyLive, sport, radiusKm, city, bairro]);

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      {/* HEADER CLEAN + BUSCA */}
      <div style={{ ...cardStyle(), padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 240 }}>
            <div style={{ fontWeight: 1000, fontSize: 17 }}>🗺️ Praças perto de você</div>
            <div style={{ opacity: 0.78, marginTop: 6, lineHeight: 1.35 }}>
              Ao vivo, check-in e chat. Tudo dentro do app.
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={badgeStyle(coords ? "gpsOn" : "gpsOff")}>{coords ? "📍 GPS ligado" : "📍 GPS (demo)"}</span>
              <span style={badgeStyle("muted")}>👤 {user?.name || "—"}</span>
              <span style={badgeStyle("live")}>🟢 {liveItems.length} ao vivo</span>
            </div>

            <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>{gpsLabel}</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {typeof onOpenLiveNow === "function" ? (
              <button type="button" style={btnStyle("primary")} onClick={openLiveSafe}>
                🟢 Ao vivo
              </button>
            ) : null}

            {coords ? (
              <button type="button" style={btnStyle("ghost")} onClick={disableGps}>
                Desligar GPS
              </button>
            ) : (
              <button type="button" style={btnStyle("ghost")} onClick={requestGps} disabled={gpsStatus === "loading"}>
                {gpsStatus === "loading" ? "Ativando…" : "Ativar GPS"}
              </button>
            )}
          </div>
        </div>

        {/* Busca + ações */}
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            style={inputStyle()}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar praça, bairro, esporte…"
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                style={btnStyle("soft")}
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                🎛️ Filtros {activeFiltersCount ? `(${activeFiltersCount})` : ""}{" "}
                <span style={{ opacity: 0.85 }}>{filtersOpen ? "▲" : "▼"}</span>
              </button>

              {hasFiltersOn ? (
                <button type="button" style={btnStyle("ghost")} onClick={clearFilters}>
                  ✖ Limpar
                </button>
              ) : null}
            </div>

            <div style={{ opacity: 0.78, fontSize: 13 }}>
              {computed.length} resultados • {liveItems.length} ao vivo
              {coords ? ` • raio: ${radiusKm}km` : ""}
            </div>
          </div>

          {/* resumo de filtros (quando fechado) */}
          {!filtersOpen && filtersSummary.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {filtersSummary.slice(0, 4).map((t) => (
                <span key={t} style={badgeStyle("active")}>
                  {t}
                </span>
              ))}
              {filtersSummary.length > 4 ? (
                <span style={{ opacity: 0.7, fontSize: 12, paddingLeft: 4 }}>
                  +{filtersSummary.length - 4}…
                </span>
              ) : null}
            </div>
          ) : null}

          {/* painel recolhível */}
          <div style={filtersPanelStyle}>
            <div style={{ ...softCardStyle(), padding: 14 }}>
              <div style={{ display: "grid", gap: 12 }}>
                {/* Toggle Ao vivo */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>🟢 Mostrar só Ao vivo</div>
                    <div style={{ opacity: 0.72, fontSize: 12, marginTop: 4 }}>
                      Filtra só praças com check-in ativo agora.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOnlyLive((v) => !v)}
                    style={onlyLive ? btnStyle("primary") : btnStyle("ghost")}
                  >
                    {onlyLive ? "Ativado" : "Desativado"}
                  </button>
                </div>

                {/* Esporte + Raio */}
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
                    <div style={{ opacity: 0.72, fontSize: 12, marginBottom: 6 }}>
                      Raio {coords ? "" : "(precisa GPS)"}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[2, 5, 10].map((km) => {
                        const on = radiusKm === km;
                        return (
                          <button
                            key={km}
                            type="button"
                            onClick={() => setRadiusKm(km)}
                            style={on ? btnStyle("primary") : btnStyle("ghost")}
                            disabled={!coords && gpsStatus !== "on"}
                            title={!coords ? "Ligue o GPS para usar raio com precisão" : ""}
                          >
                            📏 {km}km
                          </button>
                        );
                      })}
                    </div>
                    {!coords ? (
                      <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>
                        Dica: raio fica preciso quando o GPS estiver ligado (mas é opcional).
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Cidade/Bairro */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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

                  <div>
                    <div style={{ opacity: 0.72, fontSize: 12, marginBottom: 6 }}>Bairro (mock)</div>
                    <select style={inputStyle()} value={bairro} onChange={(e) => setBairro(e.target.value)}>
                      {bairroOptions.map((b) => (
                        <option key={b} value={b}>
                          {b === "all" ? "Todos" : b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ações */}
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
        </div>
      </div>

      {/* AO VIVO AGORA */}
      <div style={{ ...cardStyle(), padding: 14 }}>
        <div style={sectionTitleStyle()}>
          <span>🟢 Ao vivo agora</span>
          {typeof onOpenLiveNow === "function" ? (
            <button type="button" style={btnStyle("ghost")} onClick={openLiveSafe}>
              Ver tudo →
            </button>
          ) : null}
        </div>

        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Só aparece praça com gente marcada agora (check-in).
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {liveItems.length === 0 ? (
            <div style={softCardStyle()}>
              <div style={{ fontWeight: 1000 }}>⚪ Nenhuma praça ao vivo no momento</div>
              <div style={{ opacity: 0.75, marginTop: 6, lineHeight: 1.35 }}>
                Abre uma praça e faz check-in pra ela aparecer aqui 😄
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {typeof onOpenLiveNow === "function" ? (
                  <button type="button" style={btnStyle("primary")} onClick={openLiveSafe}>
                    🟢 Ir para Ao vivo
                  </button>
                ) : null}
                <button
                  type="button"
                  style={btnStyle("ghost")}
                  onClick={() => openCourtSafe(courts?.[0]?.id)}
                  disabled={!courts?.[0]?.id}
                >
                  Abrir uma praça
                </button>
              </div>
            </div>
          ) : (
            liveItems.slice(0, 4).map((c) => <CourtRichCard key={c.id} c={c} />)
          )}
        </div>
      </div>

      {/* PERTO DE VOCÊ */}
      <div style={{ ...cardStyle(), padding: 14 }}>
        <div style={sectionTitleStyle()}>
          <span>📍 Perto de você</span>
          <span style={{ opacity: 0.7, fontSize: 12 }}>
            {coords ? "Ordenado por distância" : "Ordenado por (ao vivo → nome)"}
          </span>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {nearItems.length === 0 ? (
            <div style={softCardStyle()}>
              <div style={{ fontWeight: 1000 }}>😕 Nada encontrado</div>
              <div style={{ opacity: 0.75, marginTop: 6, lineHeight: 1.35 }}>
                Tenta limpar filtros ou buscar por um bairro/cidade diferente.
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" style={btnStyle("primary")} onClick={clearFilters}>
                  Limpar filtros
                </button>
                {!coords ? (
                  <button type="button" style={btnStyle("ghost")} onClick={requestGps}>
                    Ativar GPS (opcional)
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            nearItems.slice(0, 8).map((c) => <CourtRichCard key={c.id} c={c} />)
          )}
        </div>
      </div>

      {/* MAIS POPULARES (MOCK) */}
      <div style={{ ...cardStyle(), padding: 14 }}>
        <div style={sectionTitleStyle()}>
          <span>🔥 Mais populares (mock)</span>
          <span style={{ opacity: 0.65, fontSize: 12 }}>ranking fictício</span>
        </div>

        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Depois a gente troca por: check-ins, mensagens, favoritos e avaliações.
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {popularItems.slice(0, 5).map((c, idx) => (
            <div key={c.id} style={softCardStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--bg-3)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 1000,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 1000, ...clampTextStyle(1) }}>{c.name}</div>
                    <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4, ...clampTextStyle(1) }}>
                      {c.address || "—"}
                    </div>
                  </div>
                </div>

                <button type="button" style={btnStyle("primary")} onClick={() => openCourtSafe(c.id)}>
                  Abrir →
                </button>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={badgeStyle()}>
                  {sportIcon(c.sports)} {((c.sports || [])[0] || "Esportes")}
                </span>
                <span style={badgeStyle("live")}>🔥 score {computePopularityScore(c)}</span>
                {(c.sports || []).slice(1, 3).map((s) => (
                  <span key={s} style={badgeStyle()}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ opacity: 0.7, fontSize: 12, padding: "0 4px" }}>
        💡 Toque em “Abrir praça” para ver check-in, presença TTL, chat e mapa.
      </div>
    </div>
  );
}
