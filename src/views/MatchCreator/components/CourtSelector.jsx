import { useMemo } from "react";
import styles from "./CourtSelector.module.css";

export default function CourtSelector({
  courts = [],
  valueCourtType,
  onChangeCourtType,
  valueCourtId,
  onChangeCourtId,
  manualId = "__manual__",
}) {
  const cleanText = (v) => String(v ?? "").replace(/\r?\n/g, "").trim();

  const list = useMemo(() => {
    const type = valueCourtType || "futsal";
    return (courts || []).filter((c) => c.__type === type);
  }, [courts, valueCourtType]);

  const selected = useMemo(() => {
    if (valueCourtId === manualId) return null;
    return (courts || []).find((c) => c.id === valueCourtId) || null;
  }, [courts, valueCourtId, manualId]);

  function changeType(next) {
    onChangeCourtType?.(next);
  }

  function handleSelect(e) {
    onChangeCourtId?.(e.target.value);
  }

  const selectedName =
    selected?.displayName || cleanText(selected?.name) || "Arena";

  const selectedCity = cleanText(selected?.city || "");
  const selectedNeighborhood = cleanText(selected?.neighborhood || "");
  const selectedAddress = cleanText(selected?.address || "");
  const selectedState = cleanText(selected?.state || "");

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <div>
          <div className={styles.kicker}>Arena</div>
          <h2 className={styles.title}>Selecione a quadra</h2>
        </div>

        <div className={styles.typePills} role="tablist" aria-label="Tipo de quadra">
          <button
            type="button"
            className={`${styles.pill} ${valueCourtType === "futsal" ? styles.active : ""}`}
            onClick={() => changeType("futsal")}
            aria-selected={valueCourtType === "futsal"}
            role="tab"
          >
            Futsal
          </button>
          <button
            type="button"
            className={`${styles.pill} ${valueCourtType === "fut7" ? styles.active : ""}`}
            onClick={() => changeType("fut7")}
            aria-selected={valueCourtType === "fut7"}
            role="tab"
          >
            Fut7 (Sintético)
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <label className={styles.label}>
          Quadra
          <select
            className={styles.select}
            value={valueCourtId || manualId}
            onChange={handleSelect}
          >
            {/* ✅ sempre disponível */}
            <option value={manualId}>Outro local (manual)</option>

            {list.length === 0 ? (
              <option value={manualId} disabled>
                Nenhuma arena disponível para este tipo
              </option>
            ) : (
              list.map((c) => {
                const labelName = c?.displayName || cleanText(c?.name) || "Quadra";
                const labelCity = cleanText(c?.city || "");
                return (
                  <option value={c.id} key={String(c.id)}>
                    {labelName}{labelCity ? ` — ${labelCity}` : ""}
                  </option>
                );
              })
            )}
          </select>
        </label>

        {/* Meta só se tiver arena selecionada */}
        {!!selected && (
          <div className={styles.meta}>
            <div className={styles.metaRow}>
              <span className={styles.dot} />
              <span className={styles.metaText}>
                <strong>{selectedName}</strong>
                {selectedNeighborhood ? ` • ${selectedNeighborhood}` : ""}
                {selectedCity ? ` • ${selectedCity}` : ""}
              </span>
            </div>

            {!!selectedAddress && (
              <div className={styles.metaSub}>
                {selectedAddress}
                {selectedState ? ` — ${selectedState}` : ""}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
