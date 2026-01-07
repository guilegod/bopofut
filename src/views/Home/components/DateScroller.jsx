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
            className={`${styles.item} ${
              isActive ? styles.active : styles.inactive
            }`}
          >
            <span
              className={`${styles.dayName} ${
                isActive ? styles.dayNameActive : ""
              }`}
            >
              {d.dayName}
            </span>

            <span className={styles.dayNum}>{d.dayNum}</span>
          </button>
        );
      })}
    </div>
  );
}
