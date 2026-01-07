import styles from "../editProfile.module.css";

export default function ProfileForm({ data, onChange }) {
  return (
    <div className={styles.fields}>
      <div className={styles.field}>
        <label>Nome de Craque</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Como você é conhecido na quadra"
        />
      </div>

      <div className={styles.field}>
        <label>Posição Preferida</label>
        <select
          value={data.position}
          onChange={(e) => onChange({ ...data, position: e.target.value })}
        >
          <option value="">Selecione sua posição</option>
          <option value="Goleiro">Goleiro</option>
          <option value="Fixo">Fixo</option>
          <option value="Ala">Ala</option>
          <option value="Pivô">Pivô</option>
        </select>
      </div>
    </div>
  );
}
