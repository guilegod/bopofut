import React, { useMemo, useRef, useState } from "react";
import styles from "./Home.module.css";

import AdBanner from "./components/AdBanner.jsx";
import TerrainSelector from "./components/TerrainSelector.jsx";
import DateScroller from "./components/DateScroller.jsx";
import MatchCard from "./components/MatchCard.jsx";
import RankingBanner from "./components/RankingBanner.jsx";

/**
 * Backend-ready notes:
 * - match.date pode vir como: "Hoje" | "Amanhã" | "YYYY-MM-DD"
 * - courts/matches podem vir vazios inicialmente
 */
export default function Home({
  matches,
  courts,
  user,
  onSelectMatch,
  onOpenRanking,
  onOpenMatchCreator,
  canCreateMatch = false, // ✅ novo (controle de permissão)
}) {
  const [activeType, setActiveType] = useState("fut7");
  const [selectedDate, setSelectedDate] = useState("Hoje");
  const scrollRef = useRef(null);

  // ===== Helpers de data (para o backend) =====
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
    // Se já vier ISO do backend, usa direto
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Se for label tipo "7 Jan", não dá pra converter com certeza — então mantém string
    return value;
  }

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
        // ✅ value em ISO para o futuro backend (sem quebrar o label)
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
      const typeMatch = String(m?.type || "").toLowerCase() === activeType;

      // ✅ dateMatch: aceita "Hoje/Amanhã" (mock atual) ou ISO (backend)
      const raw = String(m?.date || "");
      const dateMatch =
        raw === selectedDate ||
        raw === selectedISO ||
        // Se o backend mandar DateTime completo (ex: 2026-01-06T20:00:00Z)
        (raw.includes("T") && raw.slice(0, 10) === selectedISO);

      return typeMatch && dateMatch;
    });

    return filtered.sort((a, b) => {
      if (a?.distance === undefined) return 1;
      if (b?.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }, [matches, activeType, selectedDate]);

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

          {/* ✅ BOTÃO CRIAR (controlado por permissão) */}
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
              const court = (courts || []).find((c) => c?.id === match?.courtId);
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
