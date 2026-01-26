import React, { useMemo, useState } from "react";
import styles from "./MyMatches.module.css";

import Header from "./components/Header.jsx";
import FooterHint from "./components/FooterHint.jsx";
import MatchCard from "./components/MatchCard.jsx";
import EmptyState from "./components/EmptyState.jsx";

function toKey(v) {
  return String(v || "").trim();
}

function safeUpper(v) {
  return String(v || "").toUpperCase().trim();
}

function statusKeyFromBackend(match) {
  // backend: SCHEDULED | LIVE | FINISHED | CANCELED | EXPIRED
  return safeUpper(match?.status || "SCHEDULED");
}

function isUpcoming(k) {
  return k === "SCHEDULED";
}
function isLive(k) {
  return k === "LIVE";
}
function isFinished(k) {
  return k === "FINISHED";
}
function isCancelled(k) {
  return k === "CANCELED" || k === "CANCELLED";
}
function isExpired(k) {
  return k === "EXPIRED";
}

function findPresenceForUser(match, userId) {
  const list = Array.isArray(match?.presences) ? match.presences : [];
  return list.find((p) => String(p?.userId || "") === String(userId || "")) || null;
}

function presenceLabel(presence) {
  if (!presence) return null;
  // teu backend de presença não tem “status”, então: ter presença = confirmada
  return { text: "Confirmada", tone: "ok" };
}

function getMatchCourt(match, courts) {
  // 1) se veio embedado do backend (includePremium)
  if (match?.court?.id) return match.court;

  // 2) tenta bater por courtId
  const cid = toKey(match?.courtId);
  if (!cid) return null;

  const list = Array.isArray(courts) ? courts : [];
  return list.find((c) => toKey(c?.id) === cid) || null;
}

function matchLocationText(match, court) {
  const manualAddr = toKey(match?.matchAddress);
  if (manualAddr) return manualAddr;

  const addr = toKey(court?.address);
  const city = toKey(court?.city);
  const state = toKey(court?.state);

  const line = [addr, city, state].filter(Boolean).join(" • ");
  if (line) return line;

  return "Endereço não informado";
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function MyMatches({ matches = [], courts = [], user, onSelectMatch }) {
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");

  // ✅ pega somente partidas onde o user tem presença
  const myMatches = useMemo(() => {
    const uid = user?.id;
    if (!uid) return [];

    const list = Array.isArray(matches) ? matches : [];

    return list
      .filter((m) => Boolean(findPresenceForUser(m, uid)))
      .map((m) => {
        const court = getMatchCourt(m, courts);
        const k = statusKeyFromBackend(m);
        const p = findPresenceForUser(m, uid);
        const pLabel = presenceLabel(p);

        const title = (m?.title || "").trim() || court?.name || "Partida";
        const type = String(m?.type || "").toUpperCase(); // FUT7 / FUTSAL
        const loc = matchLocationText(m, court);

        return {
          ...m,
          __court: court,
          __statusKey: k,
          __presence: p,
          __presenceLabel: pLabel,
          __title: title,
          __type: type,
          __locationText: loc,
          __dateLabel: formatDateTime(m?.date),
        };
      })
      .sort((a, b) => {
        const ta = new Date(a?.date || 0).getTime();
        const tb = new Date(b?.date || 0).getTime();
        return ta - tb;
      });
  }, [matches, courts, user?.id]);

  // ✅ busca simples
  const searched = useMemo(() => {
    const q = toKey(query).toLowerCase();
    if (!q) return myMatches;

    return myMatches.filter((m) => {
      const courtName = toKey(m?.__court?.name).toLowerCase();
      const title = toKey(m?.__title).toLowerCase();
      const loc = toKey(m?.__locationText).toLowerCase();
      return title.includes(q) || courtName.includes(q) || loc.includes(q);
    });
  }, [myMatches, query]);

  // ✅ separa por status (com EXPIRED)
  const grouped = useMemo(() => {
    const live = [];
    const upcoming = [];
    const finished = [];
    const cancelled = [];
    const expired = [];

    for (const m of searched) {
      const k = m.__statusKey;

      if (isLive(k)) live.push(m);
      else if (isFinished(k)) finished.push(m);
      else if (isExpired(k)) expired.push(m);
      else if (isCancelled(k)) cancelled.push(m);
      else if (isUpcoming(k)) upcoming.push(m);
      else upcoming.push(m);
    }

    return { live, upcoming, finished, cancelled, expired };
  }, [searched]);

  const counts = useMemo(() => {
    return {
      all: searched.length,
      live: grouped.live.length,
      upcoming: grouped.upcoming.length,
      finished: grouped.finished.length,
      cancelled: grouped.cancelled.length,
      expired: grouped.expired.length,
    };
  }, [searched.length, grouped]);

  const listForTab = useMemo(() => {
    if (activeTab === "live") return grouped.live;
    if (activeTab === "upcoming") return grouped.upcoming;
    if (activeTab === "finished") return grouped.finished;
    if (activeTab === "cancelled") return grouped.cancelled;
    if (activeTab === "expired") return grouped.expired;
    return searched;
  }, [activeTab, grouped, searched]);

  return (
    <div className={styles.page}>
      <Header
        total={counts.all}
        liveCount={counts.live}
        upcomingCount={counts.upcoming}
        finishedCount={counts.finished}
        cancelledCount={counts.cancelled}
      />

      <div className={styles.filters}>
        <div style={{ width: "100%", display: "grid", gap: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por partida, quadra ou endereço..."
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontWeight: 800,
              outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className={`${styles.filterBtn} ${activeTab === "all" ? styles.active : ""}`}
              onClick={() => setActiveTab("all")}
            >
              Todas <span style={{ opacity: 0.75 }}>({counts.all})</span>
            </button>

            <button
              className={`${styles.filterBtn} ${activeTab === "live" ? styles.active : ""}`}
              onClick={() => setActiveTab("live")}
            >
              Ao vivo <span style={{ opacity: 0.75 }}>({counts.live})</span>
            </button>

            <button
              className={`${styles.filterBtn} ${activeTab === "upcoming" ? styles.active : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Próximas <span style={{ opacity: 0.75 }}>({counts.upcoming})</span>
            </button>

            <button
              className={`${styles.filterBtn} ${activeTab === "finished" ? styles.active : ""}`}
              onClick={() => setActiveTab("finished")}
            >
              Finalizadas <span style={{ opacity: 0.75 }}>({counts.finished})</span>
            </button>

            <button
              className={`${styles.filterBtn} ${activeTab === "cancelled" ? styles.active : ""}`}
              onClick={() => setActiveTab("cancelled")}
            >
              Canceladas <span style={{ opacity: 0.75 }}>({counts.cancelled})</span>
            </button>

            <button
              className={`${styles.filterBtn} ${activeTab === "expired" ? styles.active : ""}`}
              onClick={() => setActiveTab("expired")}
            >
              Expiradas <span style={{ opacity: 0.75 }}>({counts.expired})</span>
            </button>
          </div>
        </div>
      </div>

      {listForTab.length ? (
        <div className={styles.list}>
          {listForTab.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              court={m.__court}
              presenceLabel={m.__presenceLabel}
              locationText={m.__locationText}
              onClick={() => onSelectMatch(m.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      <FooterHint />
    </div>
  );
}
