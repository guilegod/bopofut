import { useMemo, useState } from "react";
import styles from "./ArenaPublicPage.module.css";
import { listSlotsForCourtOnDate } from "../../services/arenaAvailabilityStore.js";

function normalizeModality(court) {
  const t = String(court?.type || "").toUpperCase();
  if (t === "FUTSAL") return "Futsal";
  if (t === "FUT7") return "Fut7";

  const name = String(court?.name || "").toLowerCase();
  if (name.includes("futvolei")) return "Futvôlei";
  if (name.includes("volei")) return "Vôlei";
  if (name.includes("beach")) return "Beach";
  if (name.includes("areia")) return "Areia";
  if (name.includes("society")) return "Society";
  return "Esporte";
}

function initials(name) {
  const n = String(name || "").trim();
  if (!n) return "AR";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "A";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "R";
  return (a + b).toUpperCase();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDateBR(dateISO) {
  try {
    if (!dateISO) return "";
    const d = dateISO.includes("T") ? new Date(dateISO) : new Date(`${dateISO}T12:00:00`);
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

function formatMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(0);
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function timeRangeFromSlots(slots) {
  const list = uniq(slots).sort();
  if (!list.length) return "";
  if (list.length === 1) return list[0];
  return `${list[0]} – ${list[list.length - 1]}`;
}

export default function ArenaPublicPage({
  arenaOwnerId,
  courts = [],
  dateISO: dateISOProp,
  onBack,
  onOpenMatchCreator,
}) {
  const [tab, setTab] = useState("quadras"); // quadras | aoVivo | vagas
  const [dateISO, setDateISO] = useState(dateISOProp || toISODate(new Date()));
  const [query, setQuery] = useState("");
  const [modFilter, setModFilter] = useState("Todas");

  // ✅ ETAPA 2 (demo): reservados localmente (pra já ficar “vendável” no APK)
  // depois você troca esse map pelo retorno real de reservas do backend.
  const [reservedMap, setReservedMap] = useState(() => ({}));
  const isReserved = (courtId, hh) => !!reservedMap?.[courtId]?.[hh];

  const toggleReserved = (courtId, hh) => {
    setReservedMap((prev) => {
      const cur = prev?.[courtId] || {};
      const next = { ...prev, [courtId]: { ...cur, [hh]: !cur[hh] } };
      return next;
    });
  };

  const base = useMemo(() => {
    const list = Array.isArray(courts) ? courts : [];
    const group = list.filter((c) => String(c?.arenaOwnerId) === String(arenaOwnerId));
    const main = group[0] || null;

    const modalities = uniq(group.map((x) => normalizeModality(x)));
    const imageUrl =
      group.find((x) => x?.imageUrl)?.imageUrl ||
      group.find((x) => x?.photoUrl)?.photoUrl ||
      main?.imageUrl ||
      main?.photoUrl ||
      "";

    const arenaNameRaw = String(main?.name || "Arena");
    const arenaName = arenaNameRaw.split("-")[0].trim() || "Arena";

    return {
      arenaName,
      city: main?.city || "",
      address: main?.address || "",
      modalities,
      imageUrl,
      courts: group,
    };
  }, [arenaOwnerId, courts]);

  const dateLabel = formatDateBR(dateISO);
  const dateObj = useMemo(() => new Date(`${dateISO}T12:00:00`), [dateISO]);

  const courtsWithDetails = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = base.courts.map((c) => {
      const slots = (listSlotsForCourtOnDate(c.id, dateObj) || []).slice(0, 24);
      const range = timeRangeFromSlots(slots);
      return { court: c, modality: normalizeModality(c), slots, range };
    });

    let filtered = list;

    if (modFilter !== "Todas") filtered = filtered.filter((x) => x.modality === modFilter);

    if (q) {
      filtered = filtered.filter((x) => {
        const name = String(x.court?.name || "").toLowerCase();
        const addr = String(x.court?.address || "").toLowerCase();
        const mod = String(x.modality || "").toLowerCase();
        return name.includes(q) || addr.includes(q) || mod.includes(q);
      });
    }

    filtered.sort((a, b) => {
      const ds = (b.slots?.length || 0) - (a.slots?.length || 0);
      if (ds !== 0) return ds;
      return String(a.court?.name || "").localeCompare(String(b.court?.name || ""), "pt-BR");
    });

    return filtered;
  }, [base.courts, dateObj, modFilter, query]);

  const arenaSummary = useMemo(() => {
    const allSlots = [];
    for (const item of courtsWithDetails) for (const hh of item.slots || []) allSlots.push(hh);
    const globalRange = timeRangeFromSlots(allSlots);
    return {
      courtsCount: base.courts.length,
      globalRange,
      hasSlots: uniq(allSlots).length > 0,
    };
  }, [base.courts.length, courtsWithDetails]);

  // placeholders por enquanto
  const liveMatches = [];
  const vacancies = { openMatches: 0, freeHighlights: arenaSummary.hasSlots ? 1 : 0 };

  return (
    <div className={styles.page}>
      {/* ===== TOPBAR + HERO (theme-safe) ===== */}
      <div className={styles.topbar}>
    
        <div className={styles.titleWrap}>
          <div className={styles.titleRow}>
            <div className={styles.title}>🏟 {base.arenaName}</div>

            <div className={styles.rightPills}>
              {dateLabel ? <div className={styles.pill}>📅 {dateLabel}</div> : null}
              {arenaSummary.globalRange ? <div className={styles.pillSoft}>⏰ {arenaSummary.globalRange}</div> : null}
            </div>
          </div>

          <div className={styles.subtitle}>
            {base.city ? `${base.city} • ` : ""}
            {base.address || "Endereço não informado"}
          </div>

          <div className={styles.quickInfo}>
            <div className={styles.quickChip}>🥅 {arenaSummary.courtsCount} quadra(s)</div>
            {base.modalities.slice(0, 4).map((m) => (
              <div key={m} className={styles.quickChipSoft}>
                {m}
              </div>
            ))}
            {base.modalities.length > 4 ? <div className={styles.quickChipSoft}>+{base.modalities.length - 4}</div> : null}
          </div>

          <div className={styles.heroActions}>
            <button type="button" className={styles.actionPrimary} onClick={() => setTab("quadras")}>
              Ver horários
            </button>
            <button type="button" className={styles.actionSecondary} onClick={() => onOpenMatchCreator?.()}>
              + Criar pelada
            </button>
          </div>

          {/* ✅ legenda etapa 2 */}
          <div className={styles.legendRow}>
            <span className={`${styles.legendDot} ${styles.dotFree}`} />
            <span className={styles.legendText}>Livre</span>
            <span className={`${styles.legendDot} ${styles.dotRes}`} />
            <span className={styles.legendText}>Reservado</span>
            <span className={styles.legendHint}>Toque num horário pra alternar (demo)</span>
          </div>
        </div>

        <div className={styles.hero}>
          {base.imageUrl ? (
            <img className={styles.heroImg} src={base.imageUrl} alt={base.arenaName} />
          ) : (
            <div className={styles.heroFallback}>{initials(base.arenaName)}</div>
          )}
        </div>
      </div>

      {/* ===== TABS (sticky) ===== */}
      <div className={styles.tabsSticky}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "quadras" ? styles.tabActive : ""}`}
            onClick={() => setTab("quadras")}
          >
            Quadras
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "aoVivo" ? styles.tabActive : ""}`}
            onClick={() => setTab("aoVivo")}
          >
            Ao vivo
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "vagas" ? styles.tabActive : ""}`}
            onClick={() => setTab("vagas")}
          >
            Vagas
          </button>
        </div>
      </div>

      {/* ===== TOOLBAR ===== */}
      {tab === "quadras" ? (
        <div className={styles.toolbar}>
          <div className={styles.toolbarBlock}>
            <div className={styles.toolbarLabel}>Data</div>
            <input className={styles.dateInput} type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
          </div>

          <div className={styles.toolbarBlock}>
            <div className={styles.toolbarLabel}>Buscar</div>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome da quadra, modalidade, endereço…"
            />
          </div>

          <div className={styles.toolbarBlock}>
            <div className={styles.toolbarLabel}>Modalidade</div>
            <select className={styles.select} value={modFilter} onChange={(e) => setModFilter(e.target.value)}>
              <option value="Todas">Todas</option>
              {base.modalities.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {/* ===== CONTENT ===== */}
      {tab === "quadras" ? (
        <div className={styles.content}>
          {!base.courts.length ? (
            <div className={styles.emptyBox}>
              <div className={styles.emptyTitle}>Arena não encontrada</div>
              <div className={styles.emptySub}>Cadastre quadras nessa arena pra ela aparecer aqui.</div>
            </div>
          ) : courtsWithDetails.length === 0 ? (
            <div className={styles.emptyBox}>
              <div className={styles.emptyTitle}>Nada encontrado</div>
              <div className={styles.emptySub}>Tenta limpar a busca ou trocar a modalidade.</div>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => {
                  setQuery("");
                  setModFilter("Todas");
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            courtsWithDetails.map(({ court: c, modality, slots, range }) => {
              const price = formatMoney(c?.pricePerHour);
              const address = c?.address || base.address || "";
              const city = c?.city || base.city || "";

              const reservedCount = slots.reduce((acc, hh) => acc + (isReserved(c.id, hh) ? 1 : 0), 0);
              const freeCount = Math.max(0, slots.length - reservedCount);

              return (
                <div key={c.id} className={styles.courtCard}>
                  <div className={styles.courtTop}>
                    <div className={styles.courtLeft}>
                      <div className={styles.courtName}>
                        {c?.name || "Quadra"} <span className={styles.courtType}>• {modality}</span>
                      </div>

                      <div className={styles.courtMeta}>
                        <span>
                          📍 {city ? `${city}${address ? " • " : ""}` : ""}
                          {address || "Endereço não informado"}
                        </span>
                        {price ? <span>💸 R$ {price}/h</span> : <span className={styles.mutedInline}>💸 preço não informado</span>}
                        {range ? <span>⏰ {range}</span> : <span className={styles.mutedInline}>⏰ sem horários</span>}
                      </div>

                      <div className={styles.badges}>
                        <span className={styles.badge}>{modality}</span>
                        {slots.length ? (
                          <>
                            <span className={styles.badgeSoft}>Livres: {freeCount}</span>
                            <span className={styles.badgeSoft}>Reservados: {reservedCount}</span>
                          </>
                        ) : (
                          <span className={styles.badgeSoft}>Sem slots</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.courtActions}>
                      <button type="button" className={styles.primaryBtn} onClick={() => onOpenMatchCreator?.(c)}>
                        + Criar pelada
                      </button>
                      <button type="button" className={styles.secondaryBtn} onClick={() => onOpenMatchCreator?.({ courtId: c.id })}>
                        Pré-selecionar
                      </button>
                    </div>
                  </div>

                  <div className={styles.slotsRow}>
                    {slots.length ? (
                      <div className={styles.slotsScroller}>
                        {slots.map((hh) => {
                          const reserved = isReserved(c.id, hh);
                          return (
                            <button
                              key={hh}
                              type="button"
                              className={`${styles.slotChip} ${reserved ? styles.slotReserved : styles.slotFree}`}
                              onClick={() => toggleReserved(c.id, hh)}
                              title={reserved ? "Reservado (toque para marcar livre)" : "Livre (toque para marcar reservado)"}
                            >
                              {reserved ? "🔒 " : "✅ "}
                              {hh}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={styles.emptyInline}>Sem horários configurados ainda (o dono define na Agenda).</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {tab === "aoVivo" ? (
        <div className={styles.content}>
          {liveMatches.length ? (
            <div className={styles.listCol}>
              {liveMatches.map((m) => (
                <div key={m.id} className={styles.liveCard}>
                  <div className={styles.liveTitle}>{m.title || "Partida ao vivo"}</div>
                  <div className={styles.mutedInline}>Integração ao vivo entra aqui.</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyBox}>
              <div className={styles.emptyTitle}>Nenhuma partida ao vivo agora</div>
              <div className={styles.emptySub}>Depois a gente liga nos matches do backend e mostra aqui.</div>
            </div>
          )}
        </div>
      ) : null}

      {tab === "vagas" ? (
        <div className={styles.content}>
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Vagas abertas</div>
              <div className={styles.kpiValue}>{vacancies.openMatches}</div>
              <div className={styles.kpiHint}>Partidas com vagas</div>
            </div>

            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Destaques do dia</div>
              <div className={styles.kpiValue}>{vacancies.freeHighlights}</div>
              <div className={styles.kpiHint}>Sugestões rápidas</div>
            </div>
          </div>

          <div className={styles.emptyBox}>
            <div className={styles.emptyTitle}>Aba “Vagas” vira conversão</div>
            <div className={styles.emptySub}>Depois: cruzar slots + peladas abertas e montar CTA (Entrar/Reservar).</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
