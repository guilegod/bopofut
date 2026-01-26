import { useMemo } from "react";
import styles from "./SummaryCard.module.css";

export default function SummaryCard({
  formData,
  selectedCourt,
  courtType,
  arenaAddress,
  mapsUrl,

  // ✅ novo
  useArenaAddress = true,

  canCreate,
  onCreate,
}) {
  const cleanText = (v) => String(v ?? "").replace(/\r?\n/g, "").trim();

  const typeLabel = courtType === "fut7" ? "Fut7 (Sintético)" : "Futsal";

  const whenLabel = useMemo(() => {
    if (formData.dateLabel === "Outra data") {
      return formData.dateISO ? `Dia ${formData.dateISO}` : "Outra data (selecione)";
    }
    return formData.dateLabel || "Hoje";
  }, [formData.dateLabel, formData.dateISO]);

  const total = useMemo(() => {
    const max = Number(formData.maxPlayers) || 0;
    const price = Number(formData.pricePerPlayer) || 0;
    return max * price;
  }, [formData.maxPlayers, formData.pricePerPlayer]);

  const matchAddr = cleanText(formData.matchAddress || "");
  const arenaAddr = cleanText(arenaAddress || "");

  const locationLine = useArenaAddress ? arenaAddr : (matchAddr || arenaAddr || "—");
  const addressSource = useArenaAddress
    ? "Arena (automático)"
    : matchAddr
      ? "Manual (editado)"
      : arenaAddr
        ? "Arena (fallback)"
        : "—";

  const arenaNameRaw =
    selectedCourt?.displayName ||
    selectedCourt?.uiName ||
    selectedCourt?.name ||
    "—";

  const arenaName = cleanText(arenaNameRaw)
    .replace(/\((.*?)\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // extras opcionais
  const capacity = selectedCourt?.capacity;
  const pixKey = selectedCourt?.pixKey || selectedCourt?.arenaPixKey;
  const hasParking = selectedCourt?.hasParking ?? selectedCourt?.arenaHasParking;
  const hasLockerRoom = selectedCourt?.hasLockerRoom ?? selectedCourt?.arenaHasLockerRoom;
  const hasLighting = selectedCourt?.hasLighting ?? selectedCourt?.arenaHasLighting;
  const ratingAvg = selectedCourt?.ratingAvg ?? selectedCourt?.arenaRatingAvg;
  const ratingCount = selectedCourt?.ratingCount ?? selectedCourt?.arenaRatingCount;

  const detailsLine = useMemo(() => {
    const parts = [];
    if (capacity) parts.push(`👥 cap ${capacity}`);
    if (hasLighting === true) parts.push("💡 iluminação");
    if (hasLockerRoom === true) parts.push("🚿 vestiário");
    if (hasParking === true) parts.push("🚗 estacionamento");
    if (pixKey) parts.push("💳 Pix");
    if (ratingAvg) parts.push(`⭐ ${Number(ratingAvg).toFixed(1)}${ratingCount ? ` (${ratingCount})` : ""}`);
    return parts.join(" • ");
  }, [capacity, hasLighting, hasLockerRoom, hasParking, pixKey, ratingAvg, ratingCount]);

  return (
    <div className={styles.card}>
      <header className={styles.head}>
        <div className={styles.kicker}>Resumo</div>
        <h2 className={styles.title}>Prévia da partida</h2>
      </header>

      <div className={styles.body}>
        <div className={styles.bigTitle}>{cleanText(formData.title) || "Sem nome"}</div>

        <div className={styles.pills}>
          <span className={styles.pill}>{typeLabel}</span>
          <span className={styles.pill}>{whenLabel}</span>
          <span className={styles.pill}>{formData.time || "—"}</span>
        </div>

        <div className={styles.block}>
          <div className={styles.label}>Arena / Quadra</div>
          <div className={styles.value}>{arenaName || "—"}</div>
          {!!detailsLine && <div className={styles.sub}>{detailsLine}</div>}
        </div>

        <div className={styles.block}>
          <div className={styles.label}>Endereço (para jogadores)</div>
          <div className={styles.value}>{locationLine}</div>
          <div className={styles.sub}>{addressSource}</div>
        </div>

        <div className={styles.row2}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Jogadores</div>
            <div className={styles.metricValue}>{Number(formData.maxPlayers) || 0}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>R$ / jogador</div>
            <div className={styles.metricValue}>{Number(formData.pricePerPlayer) || 0}</div>
          </div>
        </div>

        <div className={styles.total}>
          <div className={styles.totalLabel}>Total estimado</div>
          <div className={styles.totalValue}>R$ {total.toFixed(0)}</div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.primary} ${canCreate ? "" : styles.disabled}`}
            onClick={canCreate ? onCreate : undefined}
          >
            Criar partida
          </button>

          <a
            className={`${styles.secondary} ${mapsUrl ? "" : styles.disabledLink}`}
            href={mapsUrl || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              if (!mapsUrl) e.preventDefault();
            }}
            title={mapsUrl ? "Abrir no Google Maps" : "Sem endereço suficiente para gerar o link"}
          >
            Ver no Maps
          </a>
        </div>

        {!canCreate && (
          <div className={styles.notice}>
            Preencha o essencial (quadra, horário, jogadores). Se escolher “Outra data”, selecione o dia.
          </div>
        )}
      </div>
    </div>
  );
}
