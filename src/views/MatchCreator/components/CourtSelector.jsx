import styles from "../matchCreator.module.css";

export default function CourtSelector({ courts, value, onChange }) {
  return (
    <div className={styles.field}>
      <label>Selecionar Arena</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {courts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.type})
          </option>
        ))}
      </select>
    </div>
  );
}
