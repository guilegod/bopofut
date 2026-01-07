import styles from "../ranking.module.css";

export default function Tabs({ value, onChange }) {
  return (
    <div className={styles.tabs}>
      {["geral", "amigos"].map((tab) => (
        <button
          key={tab}
          className={`${styles.tab} ${value === tab ? styles.active : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab === "geral" ? "Geral" : "Seu Elenco"}
        </button>
      ))}
    </div>
  );
}
