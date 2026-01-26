import { useMemo, useRef, useState, useEffect } from "react";
import styles from "./MatchCreator.module.css";

import CourtSelector from "./components/CourtSelector.jsx";
import DateSelector from "./components/DateSelector.jsx";
import MatchForm from "./components/MatchForm.jsx";
import SummaryCard from "./components/SummaryCard.jsx";

const MANUAL_ID = "__manual__";

function cleanText(v) {
  return String(v ?? "").replace(/\r?\n/g, "").trim();
}

function normalizeType(c) {
  const raw = String(c?.type || c?.courtType || c?.modality || "").toLowerCase();
  if (raw.includes("fut7") || raw.includes("society") || raw.includes("sint")) return "fut7";
  if (raw.includes("futsal")) return "futsal";
  const name = String(c?.name || "").toLowerCase();
  if (name.includes("fut7") || name.includes("sint")) return "fut7";
  return "futsal";
}

function buildArenaAddressFromCourt(c) {
  if (!c) return "";
  const city = cleanText(c.city || "");
  const neighborhood = cleanText(c.neighborhood || "");
  const address = cleanText(c.address || "");
  const state = cleanText(c.state || "");

  const left = [city, neighborhood].filter(Boolean).join(" • ");
  const right = [address, state ? `— ${state}` : ""].filter(Boolean).join(" ");
  if (left && right) return `${left} • ${right}`;
  return left || right || "";
}

function makeMapsUrl(addr) {
  const a = cleanText(addr);
  if (!a) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
}

// parse numérico seguro (não transforma vazio em 0 sem querer)
function toIntOrEmpty(v) {
  const s = String(v ?? "").trim();
  if (!s) return ""; // mantém vazio pro input não travar
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n)) return "";
  return Math.round(n);
}

// para enviar ao backend (null = “não envia” / sem valor)
function toOptionalInt(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

/**
 * ✅ PREMIUM SUPER: extrai uma data ISO (YYYY-MM-DD) a partir de:
 * - "2026-01-26"
 * - "Dia 2026-01-26"
 * - "26/01/2026"
 * Retorna "" se não conseguir.
 */
function extractISODate(anyValue) {
  const s = cleanText(anyValue);
  if (!s) return "";

  // 1) já está em ISO
  const isoMatch = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // 2) formato BR dd/mm/yyyy
  const brMatch = s.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;

  return "";
}

/**
 * ✅ PREMIUM SUPER: monta startedAt como ISO válido
 * - aceita dateISO/label em vários formatos
 * - não depende de timezone manual "-03:00"
 * - evita parse inconsistente do Date()
 */
function buildStartedAtISO(dateISO, dateLabel, time) {
  const parsedISO =
    extractISODate(dateISO) ||
    extractISODate(dateLabel) ||
    new Date().toISOString().slice(0, 10);

  const hhmm = String(time || "").match(/\b\d{2}:\d{2}\b/)?.[0] || "19:00";

  const [y, m, d] = String(parsedISO).split("-").map(Number);
  const [hh, mm] = String(hhmm).split(":").map(Number);

  if (!y || !m || !d) return null;
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

  // Data local -> ISO (backend recebe certinho)
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;

  return dt.toISOString();
}

export default function MatchCreator({
  courts = [],
  organizerId,
  user,
  onCreate,
  onBack,
  prefill,
}) {
  // =========================
  // Normaliza courts + filtro
  // =========================
  const courtsWithType = useMemo(() => {
    return (courts || []).map((c) => ({
      ...c,
      __type: normalizeType(c),
    }));
  }, [courts]);

  const filteredCourts = useMemo(() => {
    if (user?.role !== "arena_owner") return courtsWithType;
    return courtsWithType.filter((c) => String(c.arenaOwnerId) === String(user.id));
  }, [courtsWithType, user]);

  const firstCourtIdByType = (type) =>
    filteredCourts.find((c) => c.__type === type)?.id || "";

  // =========================
  // Inicial
  // =========================
  const initialType = prefill?.courtType ? String(prefill.courtType) : "futsal";
  const initialCourtId = prefill?.courtId
    ? String(prefill.courtId)
    : firstCourtIdByType(initialType);

  const [courtType, setCourtType] = useState(initialType);
  const [courtId, setCourtId] = useState(initialCourtId || MANUAL_ID);

  useEffect(() => {
    // se está manual e trocou tipo, tenta escolher primeira quadra do tipo
    if (courtId && courtId !== MANUAL_ID) return;
    const first = firstCourtIdByType(courtType);
    if (first) setCourtId(first);
  }, [courtType]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCourt = useMemo(() => {
    if (!courtId || courtId === MANUAL_ID) return null;
    return filteredCourts.find((c) => String(c.id) === String(courtId)) || null;
  }, [filteredCourts, courtId]);

  // =========================
  // Endereço automático
  // =========================
  const arenaAddress = useMemo(
    () => buildArenaAddressFromCourt(selectedCourt),
    [selectedCourt]
  );

  const [useArenaAddress, setUseArenaAddress] = useState(() => {
    return Boolean(initialCourtId && initialCourtId !== MANUAL_ID);
  });

  // refs para não sobrescrever o que o usuário editou
  const touched = useRef({
    matchAddress: false,
    maxPlayers: false,
    pricePerPlayer: false,
    title: false,
  });

  const [formData, setFormData] = useState(() => ({
    title: prefill?.title || "",
    dateLabel: prefill?.dateLabel || "Hoje",
    dateISO: prefill?.dateISO || "",
    time: prefill?.time || "19:00",

    maxPlayers: prefill?.maxPlayers ?? 14,
    pricePerPlayer: prefill?.pricePerPlayer ?? 30,

    visibility: prefill?.visibility || "public",
    matchAddress: prefill?.matchAddress || "",
    notes: prefill?.notes || "",
  }));

  // PATCH mais seguro: se alguém mandar Event sem querer, ignora
  function patchForm(patch) {
    if (!patch || typeof patch !== "object") return;
    if (patch?.target) return;

    setFormData((prev) => ({ ...prev, ...patch }));

    if (patch.matchAddress !== undefined) touched.current.matchAddress = true;
    if (patch.maxPlayers !== undefined) touched.current.maxPlayers = true;
    if (patch.pricePerPlayer !== undefined) touched.current.pricePerPlayer = true;
    if (patch.title !== undefined) touched.current.title = true;
  }

  // =========================
  // Auto preencher
  // =========================
  useEffect(() => {
    if (!selectedCourt) {
      setUseArenaAddress(false);
      return;
    }
    setUseArenaAddress((prev) =>
      prev === false && touched.current.matchAddress ? false : true
    );
  }, [selectedCourt?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCourt) return;

    const capacity = Number(selectedCourt.capacity);
    const pricePerHour = Number(selectedCourt.pricePerHour);

    setFormData((prev) => {
      const next = { ...prev };

      if (!touched.current.maxPlayers && Number.isFinite(capacity) && capacity > 1) {
        next.maxPlayers = capacity;
      }

      if (!touched.current.pricePerPlayer && Number.isFinite(pricePerHour) && pricePerHour > 0) {
        const div = Number(next.maxPlayers) || capacity || 10;
        const suggested = Math.max(1, Math.round(pricePerHour / Math.max(2, div)));
        next.pricePerPlayer = suggested;
      }

      if (useArenaAddress) {
        next.matchAddress = arenaAddress || next.matchAddress || "";
      }

      return next;
    });
  }, [selectedCourt?.id, arenaAddress, useArenaAddress]);

  useEffect(() => {
    if (!useArenaAddress) return;
    if (!arenaAddress) return;

    setFormData((prev) => ({
      ...prev,
      matchAddress: arenaAddress,
    }));
  }, [useArenaAddress, arenaAddress]);

  const mapsUrl = useMemo(
    () => makeMapsUrl(formData.matchAddress || arenaAddress),
    [formData.matchAddress, arenaAddress]
  );

  // =========================
  // Criar
  // =========================
  const canCreate = useMemo(() => {
    const hasCourt = courtId && courtId !== "";
    const timeOk = cleanText(formData.time).length >= 4;
    const titleOk = cleanText(formData.title).length >= 2;
    const playersOk = Number(toOptionalInt(formData.maxPlayers) ?? 0) >= 2;

    const priceVal = toOptionalInt(formData.pricePerPlayer);
    const priceOk = priceVal === null ? false : priceVal >= 0;

    // se escolher "Outra data", precisa dateISO
    const dateOk = formData.dateLabel !== "Outra data" || Boolean(formData.dateISO);

    return Boolean(hasCourt && timeOk && titleOk && playersOk && priceOk && dateOk);
  }, [courtId, formData]);

  async function handleCreate() {
    if (!canCreate) return;

    const maxPlayersVal = toOptionalInt(formData.maxPlayers);
    const pricePerPlayerVal = toOptionalInt(formData.pricePerPlayer);

    const startedAt = buildStartedAtISO(formData.dateISO, formData.dateLabel, formData.time);

    // DEBUG (pode tirar depois)
    // console.log("DEBUG startedAt:", {
    //   dateISO: formData.dateISO,
    //   dateLabel: formData.dateLabel,
    //   time: formData.time,
    //   startedAt,
    // });

    if (!startedAt) {
      alert("Escolha uma data válida.");
      return;
    }

    const payload = {
      title: cleanText(formData.title),
      date: startedAt,
      type: courtType.toUpperCase(),
      courtId: courtId === MANUAL_ID ? null : courtId,
      maxPlayers: maxPlayersVal ?? 14,
      pricePerPlayer: pricePerPlayerVal ?? 0,
      matchAddress: useArenaAddress
        ? arenaAddress
        : cleanText(formData.matchAddress) || arenaAddress || "",
    };

    await onCreate?.(payload);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" className={styles.back} onClick={onBack}>
          ←
        </button>
        <div className={styles.headerText}>
          <div className={styles.kicker}>Criar</div>
          <div className={styles.title}>Criar pelada</div>
        </div>
      </div>

      <div className={styles.grid}>
        <main className={styles.main}>
          <CourtSelector
            courts={filteredCourts}
            valueCourtType={courtType}
            onChangeCourtType={setCourtType}
            valueCourtId={courtId}
            onChangeCourtId={(id) => {
              setCourtId(id);
              if (id === MANUAL_ID) setUseArenaAddress(false);
            }}
            manualId={MANUAL_ID}
          />

          <DateSelector
            valueLabel={formData.dateLabel}
            valueISO={formData.dateISO}
            onChange={(patch) => patchForm(patch)}
          />

          <MatchForm
            formData={{
              ...formData,
              maxPlayers: toIntOrEmpty(formData.maxPlayers),
              pricePerPlayer: toIntOrEmpty(formData.pricePerPlayer),
            }}
            onChange={patchForm}
            patchForm={patchForm}
            arenaAddress={arenaAddress}
            mapsUrl={mapsUrl}
            courtType={courtType}
            selectedCourt={selectedCourt}
            useArenaAddress={useArenaAddress}
            onToggleUseArenaAddress={(next) => setUseArenaAddress(Boolean(next))}
          />
        </main>

        <aside className={styles.aside}>
          <SummaryCard
            formData={formData}
            selectedCourt={selectedCourt}
            courtType={courtType}
            arenaAddress={arenaAddress}
            mapsUrl={mapsUrl}
            useArenaAddress={useArenaAddress}
            canCreate={canCreate}
            onCreate={handleCreate}
          />
        </aside>
      </div>
    </div>
  );
}
