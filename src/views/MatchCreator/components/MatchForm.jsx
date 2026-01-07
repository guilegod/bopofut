import styles from "../matchCreator.module.css";

export default function MatchForm({ data, onChange }) {
  return (
    <div className={styles.grid}>
      <div className={styles.fieldFull}>
        <label>Nome da Pelada</label>
        <input
          type="text"
          value={data.title}
          placeholder="Ex: Fut dos Parceiros"
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className={styles.fieldFull}>
        <label>Endereço</label>
        <input
          type="text"
          value={data.address}
          placeholder="Ex: Rua X, 123 - Curitiba/PR"
          onChange={(e) => onChange({ address: e.target.value })}
        />
      </div>

      <div className={styles.fieldFull}>
        <label>Link do Google Maps (opcional)</label>
        <input
          type="url"
          value={data.googleMapsUrl}
          placeholder="https://maps.google.com/..."
          onChange={(e) => onChange({ googleMapsUrl: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label>Horário</label>
        <input
          type="time"
          value={data.time}
          onChange={(e) => onChange({ time: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label>Atletas (máx)</label>
        <input
          type="number"
          min="2"
          value={data.maxPlayers}
          onChange={(e) => onChange({ maxPlayers: Number(e.target.value) })}
        />
      </div>

      <div className={styles.fieldFull}>
        <label>R$ por Atleta</label>
        <input
          type="number"
          min="0"
          value={data.pricePerPlayer}
          onChange={(e) => onChange({ pricePerPlayer: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
