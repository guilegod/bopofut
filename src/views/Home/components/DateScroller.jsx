import styles from "./DateScroller.module.css";

export default function DateScroller({
  scrollRef,
  dates = [],
  selectedDate,
  onSelectDate,
}) {
  return (
    <div ref={scrollRef} className={styles.scroller}>
      {dates.map((d) => {
        const isActive = selectedDate === d.value;

        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onSelectDate(d.value)}
            className={`${styles.item} ${isActive ? styles.active : styles.inactive}`}
            aria-pressed={isActive}
          >
            <span
              className={`${styles.dayName} ${isActive ? styles.dayNameActive : ""}`}
            >
              {d.dayName}
            </span>

            <span className={styles.dayNum}>{d.dayNum}</span>

            {/* ✅ Data “completa” (Hoje/Amanhã ou "9 Jan") */}
            <span className={`${styles.label} ${isActive ? styles.labelActive : ""}`}>
              {d.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
