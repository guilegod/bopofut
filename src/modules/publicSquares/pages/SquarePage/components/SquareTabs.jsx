import { useEffect, useRef, useState } from "react";
import styles from "../SquarePage.module.css";

export default function SquareTabs({ tab, setTab, tabs, isLive }) {
  const wrapRef = useRef(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const activeBtn = wrap.querySelector(`[data-tab="${tab}"]`);
    if (!activeBtn) return;

    const wrapRect = wrap.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    const left = btnRect.left - wrapRect.left + wrap.scrollLeft;
    const width = btnRect.width;

    setPill({ left, width });
    activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [tab, tabs]);

  return (
    <div className={styles.tabsOnly}>
      <div className={styles.tabsWrap} ref={wrapRef}>
        <div
          className={styles.tabsPill}
          style={{ transform: `translateX(${pill.left}px)`, width: `${pill.width}px` }}
          aria-hidden="true"
        />

        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              data-tab={t.key}
              className={`${styles.tabBtn} ${active ? styles.tabBtnActive : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span className={styles.tabLabel}>{t.label}</span>
              {t.key === "notifications" && isLive ? <span className={styles.tabDot} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
