import styles from "./Tabs.module.css";

export default function Tabs({ activeTab, setActiveTab, hasChat }) {
  const tabs = [
    { key: "details", label: "Detalhes" },
    { key: "info", label: "Local" },
    { key: "rules", label: "Regras" },
    { key: "chat", label: "Resenha" },
  ];

  return (
    <div className={styles.tabs}>
      {tabs.map((t) => {
        const active = activeTab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`${styles.tab} ${active ? styles.active : ""}`}
          >
            {t.label}
            {t.key === "chat" && hasChat && <span className={styles.dot} />}
          </button>
        );
      })}
    </div>
  );
}
