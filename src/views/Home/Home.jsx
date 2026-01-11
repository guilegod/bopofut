import React, { useMemo, useRef, useState } from "react";
import styles from "./Home.module.css";

import AdBanner from "./components/AdBanner.jsx";
import TerrainSelector from "./components/TerrainSelector.jsx";
import DateScroller from "./components/DateScroller.jsx";
import MatchCard from "./components/MatchCard.jsx";
import RankingBanner from "./components/RankingBanner.jsx";

/**
 * Backend-ready notes:
 * - match.date (UI) é label tipo "09 jan" (vindo do App.jsx)
 * - match.dateISO (real) é ISO do backend: "2026-01-09T22:00:00.000Z"
 * - match.type pode NÃO existir no backend (derivamos por court.name/title)
 */
export default function Home({
  matches,
  courts,
  user,
  onSelectMatch,
  onOpenRanking,
  onOpenMatchCreator,
  canCreateMatch = false,
}) {
  const [activeType, setActiveType] = useState("fut7");
  const [selectedDate, setSelectedDate] = useState("Hoje");
  const scrollRef = useRef(null);

  // ===== Helpers de data =====
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
    if (t.includes("fut7")) return "fut7";
    return "";
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

  // ===== Datas do scroller =====
  const dateFilters = useMemo(() => {
    const dates = [];
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

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

  // ===== Filtragem (tipo + data) =====
  const filteredMatches = useMemo(() => {
    const selectedISO = selectedDateToISO(selectedDate);

    const filtered = (matches || []).filter((m) => {
      // ✅ type (derivado)
      const typeMatch = getMatchType(m) === activeType;

      // ✅ data (preferir dateISO quando existir)
      const rawISO = String(m?.dateISO || "");
      const isoDay = rawISO && rawISO.includes("T") ? rawISO.slice(0, 10) : rawISO;

      const dateMatch =
        // quando seleciona "Hoje/Amanhã"
        (selectedDate === "Hoje" || selectedDate === "Amanhã")
          ? isoDay === selectedISO
          : // quando seleciona data do scroller (ISO)
            isoDay === selectedISO || String(m?.date || "") === selectedDate;

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

  return (
    <div className={styles.page}>
      <AdBanner />

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Escolha seu terreno</h3>
        <TerrainSelector activeType={activeType} onChangeType={setActiveType} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Quando você quer jogar?</h3>

          <div className={styles.navBtns}>
            <button
              className={styles.iconBtn}
              type="button"
              onClick={() => scrollCalendar("left")}
            >
              ◀
            </button>
            <button
              className={styles.iconBtn}
              type="button"
              onClick={() => scrollCalendar("right")}
            >
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

      <section className={styles.section}>
        <div className={styles.matchesHeader}>
          <h2 className={styles.h2}>
            {activeType === "fut7" ? "Peladas de Fut7" : "Peladas de Futsal"}
          </h2>

          {canCreateMatch ? (
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => onOpenMatchCreator?.()}
            >
              + Criar Pelada
            </button>
          ) : null}
        </div>

        <div className={styles.matchesList}>
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => {
              const court = getMatchCourt(match);
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  court={court}
                  onClick={() => onSelectMatch(match.id)}
                />
              );
            })
          ) : (
            <div className={styles.emptyBox}>
              <p className={styles.emptyText}>
                Nenhuma partida de <b>{activeType}</b> disponível para{" "}
                <b>{String(selectedDate).toLowerCase()}</b>.
              </p>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => setSelectedDate("Hoje")}
              >
                Voltar para Hoje
              </button>
            </div>
          )}
        </div>
      </section>

      <RankingBanner onOpenRanking={onOpenRanking} />
    </div>
  );
}
