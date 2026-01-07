import styles from "../matchCreator.module.css";

export default function DateSelector({ dates, value, onSelect, onScroll, scrollRef }) {
  return (
    <div className={styles.dateBox}>
      <div className={styles.dateHeader}>
        <label>Data da Partida</label>
        <div>
          <button type="button" onClick={() => onScroll("left")}>‹</button>
          <button type="button" onClick={() => onScroll("right")}>›</button>
        </div>
      </div>

      <div className={styles.dateList} ref={scrollRef}>
        {dates.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(d.value)}
            className={value === d.value ? styles.dateActive : ""}
          >
            <span>{d.dayName}</span>
            <strong>{d.dayNum}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
