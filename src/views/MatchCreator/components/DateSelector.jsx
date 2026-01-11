import styles from "./DateSelector.module.css";

export default function DateSelector({ valueLabel, valueISO, onChange }) {
  const label = valueLabel || "Hoje";

  function setLabel(next) {
    if (next === "Outra data") {
      onChange?.({ dateLabel: next });
      return;
    }
    onChange?.({ dateLabel: next, dateISO: "" });
  }

  function setISO(e) {
    onChange?.({ dateLabel: "Outra data", dateISO: e.target.value });
  }

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <div className={styles.kicker}>Quando</div>
        <h2 className={styles.title}>Data da partida</h2>
      </header>

      <div className={styles.body}>
        <div className={styles.pills} role="tablist" aria-label="Selecionar data">
          <button
            type="button"
            className={`${styles.pill} ${label === "Hoje" ? styles.active : ""}`}
            onClick={() => setLabel("Hoje")}
            role="tab"
            aria-selected={label === "Hoje"}
          >
            Hoje
          </button>

          <button
            type="button"
            className={`${styles.pill} ${label === "Amanhã" ? styles.active : ""}`}
            onClick={() => setLabel("Amanhã")}
            role="tab"
            aria-selected={label === "Amanhã"}
          >
            Amanhã
          </button>

          <button
            type="button"
            className={`${styles.pill} ${label === "Outra data" ? styles.active : ""}`}
            onClick={() => setLabel("Outra data")}
            role="tab"
            aria-selected={label === "Outra data"}
          >
            Outra data
          </button>
        </div>

        {label === "Outra data" && (
          <label className={styles.label}>
            Escolha no calendário
            <input className={styles.input} type="date" value={valueISO || ""} onChange={setISO} />
          </label>
        )}
      </div>
    </section>
  );
}
