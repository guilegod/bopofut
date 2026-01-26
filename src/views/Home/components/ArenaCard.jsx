import React from "react";
import styles from "../Home.module.css";

function initials(name) {
  const n = String(name || "").trim();
  if (!n) return "A";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "A";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function formatOpenClose(openTime, closeTime) {
  const o = String(openTime || "").trim();
  const c = String(closeTime || "").trim();
  if (!o && !c) return "";
  if (o && c) return `${o} – ${c}`;
  if (o) return `Abre: ${o}`;
  return `Fecha: ${c}`;
}

export default function ArenaCard({ arena, selectedDate, onOpen }) {
  const a = arena || {};
  const name = a.name || "Arena";
  const locationText = `${a.city || "Cidade"}${a.address ? ` • ${a.address}` : ""}`;
  const dayLabel = selectedDate === "Hoje" ? "Hoje" : selectedDate === "Amanhã" ? "Amanhã" : "No dia";

  const openClose = formatOpenClose(a.openTime, a.closeTime);
  const timeLine = openClose || a.timeRange || "";

  return (
    <button type="button" className={styles.arenaCard} onClick={onOpen}>
      <div className={styles.arenaThumb}>
        {a.imageUrl ? <img src={a.imageUrl} alt={name} /> : <div className={styles.arenaInitials}>{initials(name)}</div>}
      </div>

      <div className={styles.arenaInfo}>
        <div className={styles.arenaTopRow}>
          <div style={{ minWidth: 0 }}>
            <div className={styles.arenaName}>🏟 {name}</div>
            <div className={styles.arenaMeta}>📍 {locationText}</div>
            <div className={styles.arenaMetaSmall}>🥅 Quadras: {a.courtsCount ?? 0}</div>
          </div>

          <div className={styles.arenaArrow}>→</div>
        </div>

        <div className={styles.arenaPills}>
          {(a.modalities || []).length ? (
            (a.modalities || []).slice(0, 6).map((m) => (
              <span key={m} className={styles.arenaPill}>
                {m}
              </span>
            ))
          ) : (
            <span className={styles.arenaPill}>Sem modalidades</span>
          )}
        </div>

        <div className={styles.arenaTime}>
          ⏰ {dayLabel}: {timeLine || "Sem horários configurados"}
        </div>

        <div className={styles.arenaHint}>Toque para abrir a arena e ver quadras/agenda</div>
      </div>
    </button>
  );
}
