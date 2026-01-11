import { useMemo, useRef, useState, useEffect } from "react";
import styles from "./MatchCreator.module.css";

import CourtSelector from "./components/CourtSelector.jsx";
import DateSelector from "./components/DateSelector.jsx";
import MatchForm from "./components/MatchForm.jsx";
import SummaryCard from "./components/SummaryCard.jsx";

const MANUAL_ID = "__manual__";

/**
 * MatchCreator (BóPô Fut)
 * - Agora suporta criar partida SEM arena (manual)
 * - Manual: courtId = "__manual__" e exige matchAddress
 * - Arena: courtId = id RAW (mas App manda limpo no POST)
 */
export default function MatchCreator({
  courts = [],
  organizerId,
  onCreate,
  onBack,
  defaultType = "futsal", // "futsal" | "fut7"
}) {
  const scrollRef = useRef(null);

  const safeCourts = Array.isArray(courts) ? courts : [];
  const cleanText = (v) => String(v ?? "").replace(/\r?\n/g, "").trim();

  const inferTypeFromText = (txt) => {
    const t = cleanText(txt).toLowerCase();
    if (!t) return "";
    if (
      t.includes("fut7") ||
      t.includes("society") ||
      t.includes("sint") ||
      t.includes("sintético") ||
      t.includes("sintetico")
    ) {
      return "fut7";
    }
    if (t.includes("futsal") || t.includes("sal")) return "futsal";
    return "";
  };

  const normalizeCourtType = (court) => {
    const raw = (court?.type || court?.surface || court?.category || "")
      .toString()
      .toLowerCase();

    if (raw.includes("7") || raw.includes("fut7") || raw.includes("sint") || raw.includes("society"))
      return "fut7";
    if (raw.includes("sal") || raw.includes("futsal")) return "futsal";

    return inferTypeFromText(court?.name) || inferTypeFromText(court?.id) || "futsal";
  };

  const courtsWithType = useMemo(() => {
    return safeCourts.map((c) => {
      const __type = normalizeCourtType(c);

      const idRaw = String(c?.id ?? "");
      const nameRaw = String(c?.name ?? "");

      const uiId = cleanText(idRaw);
      const uiName = cleanText(nameRaw);

      const displayName = uiName
        .replace(/\((.*?)\)/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      return {
        ...c,
        id: idRaw,
        name: nameRaw,
        uiId,
        uiName,
        displayName,
        __type,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCourts]);

  const firstCourtIdByType = (type) => courtsWithType.find((c) => c.__type === type)?.id || "";

  const [courtType, setCourtType] = useState(defaultType);

  const [courtId, setCourtId] = useState(() => {
    const first = firstCourtIdByType(defaultType);
    return first || MANUAL_ID;
  });

  // quando trocar tipo: se não tiver quadra daquele tipo, vira manual
  useEffect(() => {
    const selectedCourt = courtsWithType.find((c) => c.id === courtId) || null;

    const first = firstCourtIdByType(courtType);

    if (!first) {
      if (courtId !== MANUAL_ID) setCourtId(MANUAL_ID);
      return;
    }

    if (!selectedCourt) {
      setCourtId(first);
      return;
    }

    if (selectedCourt.__type !== courtType) {
      setCourtId(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtType, courtsWithType]);

  const isManual = courtId === MANUAL_ID;

  const selectedCourt = useMemo(() => {
    if (isManual) return null;
    return courtsWithType.find((c) => c.id === courtId) || null;
  }, [courtsWithType, courtId, isManual]);

  const [formData, setFormData] = useState({
    courtId: courtId,

    dateLabel: "Hoje",
    dateISO: "",
    time: "19:00",

    title: "",
    maxPlayers: 14,
    pricePerPlayer: 30,

    matchAddress: "",

    notes: "",
    visibility: "public",
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, courtId }));
  }, [courtId]);

  useEffect(() => {
    setFormData((prev) => {
      if (prev.title?.trim()) return prev;

      // se manual, não tenta montar título pela arena
      if (isManual) {
        const prefix = courtType === "fut7" ? "Fut7" : "Futsal";
        return { ...prev, title: `Pelada ${prefix}` };
      }

      const niceName = selectedCourt?.displayName || cleanText(selectedCourt?.name) || "";
      if (!niceName) return prev;

      const prefix = courtType === "fut7" ? "Fut7" : "Futsal";
      return { ...prev, title: `Pelada ${prefix} - ${niceName}` };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourt?.name, selectedCourt?.displayName, courtType, isManual]);

  const arenaAddress = useMemo(() => {
    if (!selectedCourt) return "";
    const parts = [
      selectedCourt.address,
      selectedCourt.neighborhood,
      selectedCourt.city,
      selectedCourt.state,
    ]
      .map((x) => cleanText(x))
      .filter(Boolean);

    return parts.join(", ");
  }, [selectedCourt]);

  const mapsQuery = useMemo(() => {
    const raw = cleanText(formData.matchAddress) || cleanText(arenaAddress);
    if (!raw) return "";
    return encodeURIComponent(raw);
  }, [formData.matchAddress, arenaAddress]);

  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}` : "";

  const canCreate = useMemo(() => {
    if (!organizerId) return false;
    if (!formData.time) return false;
    if (!formData.maxPlayers || formData.maxPlayers < 2) return false;
    if (formData.pricePerPlayer < 0) return false;
    if (formData.dateLabel === "Outra data" && !formData.dateISO) return false;

    // ✅ regra nova:
    // - manual: exige endereço
    // - arena: exige courtId real
    if (isManual) {
      return !!cleanText(formData.matchAddress);
    }
    return !!formData.courtId && formData.courtId !== MANUAL_ID;
  }, [formData, organizerId, isManual]);

  const payload = useMemo(() => {
    return {
      organizerId,
      courtId: formData.courtId, // "__manual__" ou id RAW
      type: courtType,

      title: cleanText(formData.title),
      dateLabel: formData.dateLabel,
      dateISO: cleanText(formData.dateISO),
      time: formData.time,
      maxPlayers: Number(formData.maxPlayers) || 0,
      pricePerPlayer: Number(formData.pricePerPlayer) || 0,

      matchAddress: cleanText(formData.matchAddress),

      notes: cleanText(formData.notes),
      visibility: formData.visibility,
    };
  }, [formData, organizerId, courtType]);

  function update(patch) {
    setFormData((prev) => ({ ...prev, ...patch }));
  }

  async function handleCreate() {
    if (!canCreate) return;

    try {
      await onCreate?.(payload);

      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
      });
    } catch (err) {
      console.error("MatchCreator onCreate error:", err);
      alert("Erro ao criar partida. Verifique os dados e tente novamente.");
    }
  }

  return (
    <div className={styles.page} ref={scrollRef}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} type="button" aria-label="Voltar">
          ←
        </button>

        <div className={styles.headerText}>
          <div className={styles.kicker}>Criar Pelada</div>
          <h1 className={styles.title}>MatchCreator</h1>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.badgePremium}>Premium</span>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.leftCol}>
          <CourtSelector
            courts={courtsWithType}
            valueCourtType={courtType}
            onChangeCourtType={setCourtType}
            valueCourtId={courtId}
            onChangeCourtId={setCourtId}
            manualId={MANUAL_ID}
          />

          <DateSelector
            valueLabel={formData.dateLabel}
            valueISO={formData.dateISO}
            onChange={(next) => update(next)}
          />

          <MatchForm
            formData={formData}
            onChange={update}
            arenaAddress={arenaAddress}
            mapsUrl={mapsUrl}
            courtType={courtType}
            selectedCourt={selectedCourt}
          />
        </section>

        <aside className={styles.rightCol}>
          <SummaryCard
            formData={formData}
            selectedCourt={selectedCourt}
            courtType={courtType}
            arenaAddress={arenaAddress}
            mapsUrl={mapsUrl}
            canCreate={canCreate}
            onCreate={handleCreate}
          />
        </aside>
      </div>
    </div>
  );
}
