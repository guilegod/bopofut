// Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Home.module.css";

import AdBanner from "./components/AdBanner.jsx";
import TerrainSelector from "./components/TerrainSelector.jsx";
import DateScroller from "./components/DateScroller.jsx";
import MatchCard from "./components/MatchCard.jsx";
//import RankingBanner from "./components/RankingBanner.jsx";

import { listSlotsForCourtOnDate } from "../../services/arenaAvailabilityStore.js";

export default function Home({
  matches,
  courts,
  user,
  onSelectMatch,
  onOpenRanking,
  onOpenMatchCreator,
  canCreateMatch = false,
  onOpenArena,
}) {
  const [activeType, setActiveType] = useState("fut7");
  const [selectedDate, setSelectedDate] = useState("Hoje");
  const [heroDismissed, setHeroDismissed] = useState(() => {
    try {
      return localStorage.getItem("bp_hide_owner_banner") === "1";
    } catch {
      return false;
    }
  });
  const [heroCompact, setHeroCompact] = useState(false);

  const scrollRef = useRef(null);
  const arenasScrollRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setHeroCompact(y > 90);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toISODate(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function selectedDateToISO(value) {
    const now = new Date();
    if (value === "Hoje") return toISODate(now);
    if (value === "Amanhã") {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return toISODate(d);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return value;
  }

  function inferTypeFromText(txt) {
    const t = String(txt || "").toLowerCase();
    if (t.includes("futsal")) return "futsal";
    if (t.includes("sint") || t.includes("sintético") || t.includes("sintetico")) return "fut7";
    return "";
  }

  function normalizeModality(court) {
    const t = String(court?.type || "").toUpperCase();
    if (t === "FUTSAL") return "Futsal";
    if (t === "FUT7") return "Sintético";

    const name = String(court?.name || "").toLowerCase();
    if (name.includes("futvolei")) return "Futvôlei";
    if (name.includes("volei")) return "Vôlei";
    if (name.includes("beach")) return "Beach";
    if (name.includes("areia")) return "Areia";
    if (name.includes("society")) return "Society";
    return "Esporte";
  }

  function getMatchCourt(match) {
    if (match?.court?.id) return match.court;
    const cid = match?.courtId;
    if (!cid) return null;
    return (courts || []).find((c) => c?.id === cid) || null;
  }

  function getMatchType(match) {
    const direct = String(match?.type || "").toLowerCase();
    if (direct === "fut7" || direct === "futsal") return direct;

    const court = getMatchCourt(match);
    const byCourt = inferTypeFromText(court?.name);
    if (byCourt) return byCourt;

    const byTitle = inferTypeFromText(match?.title);
    if (byTitle) return byTitle;

    return "fut7";
  }

  const dateFilters = useMemo(() => {
    const dates = [];
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      let label = "";
      let value = "";

      if (i === 0) {
        label = "Hoje";
        value = "Hoje";
      } else if (i === 1) {
        label = "Amanhã";
        value = "Amanhã";
      } else {
        label = `${d.getDate()} ${months[d.getMonth()]}`;
        value = toISODate(d);
      }

      dates.push({
        dayName: days[d.getDay()],
        dayNum: d.getDate(),
        label,
        value,
      });
    }

    return dates;
  }, []);

  const filteredMatches = useMemo(() => {
    const selectedISO = selectedDateToISO(selectedDate);

    const filtered = (matches || []).filter((m) => {
      const typeMatch = getMatchType(m) === activeType;

      const rawISO = String(m?.dateISO || m?.date || "");
      const isoDay = rawISO && rawISO.includes("T") ? rawISO.slice(0, 10) : rawISO;

      const dateMatch =
        selectedDate === "Hoje" || selectedDate === "Amanhã"
          ? isoDay === selectedISO
          : isoDay === selectedISO || String(m?.date || "") === selectedDate;

      return typeMatch && dateMatch;
    });

    return filtered.sort((a, b) => {
      if (a?.distance === undefined) return 1;
      if (b?.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }, [matches, courts, activeType, selectedDate]);

  function scrollCalendar(direction) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -150 : 150,
      behavior: "smooth",
    });
  }

  function scrollArenas(direction) {
    if (!arenasScrollRef.current) return;
    arenasScrollRef.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  }

  function pickMainCourt(courtsInArena) {
    const list = Array.isArray(courtsInArena) ? courtsInArena : [];
    const byArenaName = list.find((c) => String(c?.name || "").toLowerCase().includes("arena"));
    return byArenaName || list[0] || null;
  }

  function formatTimeRange(slots) {
    const arr = Array.from(new Set((slots || []).filter(Boolean))).sort();
    if (!arr.length) return "";
    const first = arr[0];
    const last = arr[arr.length - 1];
    if (first === last) return first;
    return `${first} – ${last}`;
  }

  function initials(name) {
    const n = String(name || "").trim();
    if (!n) return "A";
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "A";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
  }

  const arenas = useMemo(() => {
    const list = Array.isArray(courts) ? courts : [];
    const map = new Map();

    for (const c of list) {
      const arenaId = String(c?.arenaOwnerId || c?.arenaId || c?.id || "unknown");
      if (!map.has(arenaId)) map.set(arenaId, []);
      map.get(arenaId).push(c);
    }

    const selectedISO = selectedDateToISO(selectedDate);
    const dateObj = new Date(`${selectedISO}T12:00:00`);

    const result = [];
    for (const [arenaId, cs] of map.entries()) {
      const main = pickMainCourt(cs);

      let arenaName = String(main?.name || "Arena").trim();
      if (!arenaName.toLowerCase().includes("arena")) {
        const better = cs.find((c) => String(c?.name || "").toLowerCase().includes("arena"));
        if (better?.name) arenaName = String(better.name).trim();
      }

      const city = main?.city || "";
      const address = main?.address || "";

      const modalities = Array.from(new Set(cs.map((x) => normalizeModality(x)))).slice(0, 6);

      const slots = [];
      for (const c of cs.slice(0, 6)) {
        const s = listSlotsForCourtOnDate(c.id, dateObj);
        for (const hh of (s || []).slice(0, 24)) slots.push(hh);
      }
      const uniqueSlots = Array.from(new Set(slots)).sort();
      const range = formatTimeRange(uniqueSlots);

      result.push({
        arenaId,
        arenaName,
        city,
        address,
        courtsCount: cs.length,
        modalities,
        slots: uniqueSlots,
        timeRange: range,
        imageUrl: main?.imageUrl || main?.photoUrl || "",
      });
    }

    result.sort((a, b) => String(a.arenaName).localeCompare(String(b.arenaName), "pt-BR"));
    return result;
  }, [courts, selectedDate]);

  const todayLabel = selectedDate === "Hoje" ? "Hoje" : selectedDate === "Amanhã" ? "Amanhã" : "No dia";

  return (
    <div className={styles.page}>
      {/* ✅ Watermark premium de fundo (logo) */}
      <div className={styles.brandWatermark} aria-hidden="true" />

      {!heroDismissed ? (
        <div className={`${styles.hero} ${heroCompact ? styles.heroCompact : ""}`}>
          <button
            type="button"
            className={styles.heroClose}
            aria-label="Fechar banner"
            title="Fechar"
            onClick={() => {
              setHeroDismissed(true);
              try {
                localStorage.setItem("bp_hide_owner_banner", "1");
              } catch {}
            }}
          >
            ✕
          </button>

          <div className={styles.heroInner}>
            <AdBanner />
          </div>
        </div>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeaderStack}>
          <h3 className={styles.sectionTitle}>Escolha seu terreno</h3>
          <div className={styles.sectionHint}>Selecione o tipo de jogo para filtrar arenas e peladas.</div>
        </div>
        <TerrainSelector activeType={activeType} onChangeType={setActiveType} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Quando você quer jogar?</h3>

          <div className={styles.navBtns}>
            <button className={styles.iconBtn} type="button" onClick={() => scrollCalendar("left")}>
              ◀
            </button>
            <button className={styles.iconBtn} type="button" onClick={() => scrollCalendar("right")}>
              ▶
            </button>
          </div>
        </div>

        <DateScroller
          scrollRef={scrollRef}
          dates={dateFilters}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </section>

      {/* ✅ Arenas & Horários */}
      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.h2}>Arenas & Horários</h2>

          <div className={styles.navBtns}>
            <button className={styles.iconBtn} type="button" onClick={() => scrollArenas("left")}>
              ◀
            </button>
            <button className={styles.iconBtn} type="button" onClick={() => scrollArenas("right")}>
              ▶
            </button>
          </div>
        </div>

        {arenas.length ? (
          <div ref={arenasScrollRef} className={styles.arenasScroller}>
            {arenas.map((a) => {
              const locationText = `${a.city || "Cidade"}${a.address ? ` • ${a.address}` : ""}`;

              return (
                <button
                  key={a.arenaId}
                  type="button"
                  className={styles.arenaCard}
                  onClick={() => onOpenArena?.(a.arenaId)}
                >
                  <div className={styles.arenaMedia}>
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt={a.arenaName} className={styles.arenaImg} />
                    ) : (
                      <div className={styles.arenaInitials}>{initials(a.arenaName)}</div>
                    )}
                  </div>

                  <div className={styles.arenaContent}>
                    <div className={styles.arenaTopRow}>
                      <div className={styles.arenaTitleBox}>
                        <div className={styles.arenaTitle}>🏟 {a.arenaName}</div>
                        <div className={styles.arenaMeta}>📍 {locationText}</div>
                        <div className={styles.arenaMetaSmall}>🥅 Quadras: {a.courtsCount}</div>
                      </div>

                      <div className={styles.arenaArrow}>→</div>
                    </div>

                    <div className={styles.badge}>📅 {todayLabel}</div>

                    <div className={styles.chips}>
                      {a.modalities.map((m) => (
                        <span key={m} className={styles.chip}>
                          {m}
                        </span>
                      ))}
                    </div>

                    <div className={`${styles.timeLine} ${!a.timeRange ? styles.timeLineEmpty : ""}`}>
                      ⏰ {todayLabel}: {a.timeRange ? a.timeRange : "Sem horários configurados"}
                    </div>

                    <div className={styles.arenaBottomRow}>
                      <div className={styles.hint}>Toque para abrir a arena e ver quadras/agenda</div>
                      <div className={styles.arenaCta}>Ver horários →</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyBox}>
            <p className={styles.emptyText}>Nenhuma arena encontrada (Courts veio vazio).</p>
          </div>
        )}
      </section>

      {/* Partidas */}
      <section className={styles.section}>
        <div className={styles.matchesHeader}>
          <h2 className={styles.h2}>{activeType === "fut7" ? "Peladas de Fut7" : "Peladas de Futsal"}</h2>

          {canCreateMatch ? (
            <button type="button" className={styles.createBtn} onClick={() => onOpenMatchCreator?.()}>
              + Criar Pelada
            </button>
          ) : null}
        </div>

        <div className={styles.matchesList}>
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => {
              const court = getMatchCourt(match);
              return <MatchCard key={match.id} match={match} court={court} onClick={() => onSelectMatch(match.id)} />;
            })
          ) : (
            <div className={styles.emptyBox}>
              <p className={styles.emptyText}>
                ⚽ Nenhuma pelada de <b>{activeType}</b> para <b>{String(selectedDate).toLowerCase()}</b>.
              </p>

              <div className={styles.emptyActions}>
                {canCreateMatch ? (
                  <button type="button" className={styles.primaryBtn} onClick={() => onOpenMatchCreator?.()}>
                    + Criar uma pelada
                  </button>
                ) : null}

                <button type="button" className={styles.linkBtn} onClick={() => setSelectedDate("Hoje")}>
                  Voltar para Hoje
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
