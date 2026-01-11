import { useMemo, useState } from "react";
import styles from "./MyMatches.module.css";

import Header from "./components/Header.jsx";
import MatchCard from "./components/MatchCard.jsx";
import EmptyState from "./components/EmptyState.jsx";
import FooterHint from "./components/FooterHint.jsx";

function statusKey(s) {
  return String(s || "SCHEDULED").toUpperCase();
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeJoined(matches, userId) {
  return safeArr(matches).filter((m) =>
    safeArr(m?.presences).some((p) => p.userId === userId)
  );
}

function matchDateISO(m) {
  const raw = String(m?.dateISO || m?.date || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw.includes("T")) return raw.slice(0, 10);
  return "9999-12-31";
}

function sortByDateTime(a, b) {
  const da = matchDateISO(a);
  const db = matchDateISO(b);
  if (da !== db) return da.localeCompare(db);
  return String(a?.time || "").localeCompare(String(b?.time || ""));
}

export default function MyMatches({ matches = [], courts = [], user, onSelectMatch }) {
  const [filter, setFilter] = useState("ALL");

  const myMatches = useMemo(() => {
    return normalizeJoined(matches, user?.id);
  }, [matches, user?.id]);

  const grouped = useMemo(() => {
    const live = [];
    const upcoming = [];
    const finished = [];
    const cancelled = [];

    for (const m of myMatches) {
      const s = statusKey(m?.admin?.status);
      if (s === "STARTED") live.push(m);
      else if (s === "FINISHED") finished.push(m);
      else if (s === "CANCELLED") cancelled.push(m);
      else upcoming.push(m);
    }

    live.sort(sortByDateTime);
    upcoming.sort(sortByDateTime);
    finished.sort(sortByDateTime).reverse();
    cancelled.sort(sortByDateTime).reverse();

    return { live, upcoming, finished, cancelled };
  }, [myMatches]);

  const list = useMemo(() => {
    if (filter === "LIVE") return grouped.live;
    if (filter === "UPCOMING") return grouped.upcoming;
    if (filter === "FINISHED") return grouped.finished;
    if (filter === "CANCELLED") return grouped.cancelled;

    return [
      ...grouped.live,
      ...grouped.upcoming,
      ...grouped.finished,
      ...grouped.cancelled,
    ];
  }, [filter, grouped]);

  function getCourt(match) {
    return courts.find((c) => c.id === match.courtId) || null;
  }

  return (
    <div className={styles.page}>
      <Header
        total={myMatches.length}
        liveCount={grouped.live.length}
        upcomingCount={grouped.upcoming.length}
        finishedCount={grouped.finished.length}
        cancelledCount={grouped.cancelled.length}
      />

      <div className={styles.filters}>
        {["ALL", "LIVE", "UPCOMING", "FINISHED", "CANCELLED"].map((k) => (
          <button
            key={k}
            className={`${styles.filterBtn} ${filter === k ? styles.active : ""}`}
            onClick={() => setFilter(k)}
          >
            {k === "ALL"
              ? "Todas"
              : k === "LIVE"
              ? "Em andamento"
              : k === "UPCOMING"
              ? "Próximas"
              : k === "FINISHED"
              ? "Finalizadas"
              : "Canceladas"}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {list.length > 0 ? (
          list.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              court={getCourt(match)}
              onClick={() => onSelectMatch(match.id)}
            />
          ))
        ) : (
          <EmptyState filter={filter} />
        )}
      </div>

      <FooterHint />
    </div>
  );
}
