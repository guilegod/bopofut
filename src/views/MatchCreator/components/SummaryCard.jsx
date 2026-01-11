import { useMemo } from "react";
import styles from "./SummaryCard.module.css";

export default function SummaryCard({
  formData,
  selectedCourt,
  courtType,
  arenaAddress,
  mapsUrl,
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
  const locationLine = matchAddr || arenaAddr || "—";

  const arenaNameRaw =
    selectedCourt?.displayName ||
    selectedCourt?.uiName ||
    selectedCourt?.name ||
    "—";

  const arenaName = cleanText(arenaNameRaw)
    .replace(/\((.*?)\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const addressSource = matchAddr ? "Endereço real (partida)" : arenaAddr ? "Localidade da arena" : "—";

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
          <div className={styles.label}>Arena</div>
          <div className={styles.value}>{arenaName || "—"}</div>
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
            title={
              mapsUrl
                ? "Abrir rota/consulta no Google Maps"
                : "Sem endereço suficiente para gerar o link"
            }
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
