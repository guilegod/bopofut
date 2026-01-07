import { useMemo, useRef, useState } from "react";
import styles from "./matchCreator.module.css";

import CourtSelector from "./components/CourtSelector.jsx";
import DateSelector from "./components/DateSelector.jsx";
import MatchForm from "./components/MatchForm.jsx";
import SummaryCard from "./components/SummaryCard.jsx";

export default function MatchCreator({ courts = [], organizerId, onCreate, onBack }) {
  const scrollRef = useRef(null);

  const firstCourtId = courts?.[0]?.id || "";

  const [formData, setFormData] = useState({
    courtId: firstCourtId,
    date: "Hoje",
    time: "19:00",
    maxPlayers: 14,
    pricePerPlayer: 30,

    // ✅ novos campos
    title: courts?.[0]?.name ? `Pelada - ${courts[0].name}` : "",
    address: courts?.[0]?.address || "",
    googleMapsUrl: courts?.[0]?.googleMapsUrl || "",
  });

  const selectedCourt = (courts || []).find((c) => c.id === formData.courtId) || null;

  function normalizeType(courtType) {
    const t = String(courtType || "").toLowerCase();
    if (t.includes("futsal")) return "futsal";
    return "fut7";
  }

  // ✅ quando trocar a quadra, pré-preenche nome/endereço/maps
  function handleCourtChange(courtId) {
    const court = (courts || []).find((c) => c.id === courtId) || null;

    setFormData((prev) => ({
      ...prev,
      courtId,
      title: court?.name ? `Pelada - ${court.name}` : prev.title,
      address: court?.address || "",
      googleMapsUrl: court?.googleMapsUrl || "",
    }));
  }

  const dateOptions = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const list = [];

    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      const label =
        i === 0 ? "Hoje" : i === 1 ? "Amanhã" : `${d.getDate()} ${months[d.getMonth()]}`;

      list.push({
        dayName: days[d.getDay()],
        dayNum: d.getDate(),
        value: label,
      });
    }
    return list;
  }, []);

  function scrollCalendar(dir) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.courtId || !selectedCourt) return;

    const newMatch = {
      id: `m-${Date.now()}`, // backend depois
      courtId: formData.courtId,
      organizerId,

      // ✅ dados da partida
      title: String(formData.title || "").trim(),
      address: String(formData.address || "").trim(),
      googleMapsUrl: String(formData.googleMapsUrl || "").trim(),

      date: formData.date,
      time: formData.time,
      type: normalizeType(selectedCourt?.type),

      pricePerPlayer: Number(formData.pricePerPlayer) || 0,
      maxPlayers: Number(formData.maxPlayers) || 0,

      currentPlayers: organizerId ? [organizerId] : [],
      messages: [],
    };

    await onCreate?.(newMatch);
  }

  const canSubmit = Boolean(
    formData.courtId &&
      selectedCourt &&
      String(formData.title || "").trim() &&
      String(formData.address || "").trim() &&
      String(formData.googleMapsUrl || "").trim()
  );

  return (
    <div className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <CourtSelector
          courts={courts}
          value={formData.courtId}
          onChange={handleCourtChange}
        />

        <DateSelector
          dates={dateOptions}
          value={formData.date}
          onSelect={(date) => setFormData((prev) => ({ ...prev, date }))}
          onScroll={scrollCalendar}
          scrollRef={scrollRef}
        />

        <MatchForm
          data={formData}
          onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        />

        <SummaryCard data={formData} />

        <button type="submit" className={styles.submit} disabled={!canSubmit}>
          Publicar Pelada
        </button>

        {!courts?.length ? (
          <div style={{ opacity: 0.75, marginTop: 10 }}>
            Nenhuma quadra disponível ainda.
          </div>
        ) : null}
      </form>
    </div>
  );
}
