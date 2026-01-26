import styles from "../EditProfile.module.css";

export default function ProfileForm({ mode = "player", data, onChange }) {
  const isArena = mode === "arena";

  if (isArena) {
    return (
      <div className={styles.fields}>
        <div className={styles.field}>
          <label>Nome da Arena</label>
          <input
            type="text"
            value={data.arenaName || ""}
            onChange={(e) => onChange({ ...data, arenaName: e.target.value })}
            placeholder="Ex: Arena X"
          />
        </div>

        <div className={styles.field}>
          <label>WhatsApp Comercial</label>
          <input
            type="text"
            value={data.phone || ""}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            placeholder="(41) 9xxxx-xxxx"
          />
        </div>

        <div className={styles.field}>
          <label>Cidade</label>
          <input
            type="text"
            value={data.city || ""}
            onChange={(e) => onChange({ ...data, city: e.target.value })}
            placeholder="Curitiba"
          />
        </div>

        <div className={styles.field}>
          <label>Endereço</label>
          <input
            type="text"
            value={data.address || ""}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="Rua / bairro / número"
          />
        </div>

        <div className={styles.field}>
          <label>Horário de Funcionamento</label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={!!data.is24h}
                onChange={(e) => onChange({ ...data, is24h: e.target.checked })}
              />
              24h
            </label>

            {!data.is24h ? (
              <>
                <input
                  type="time"
                  value={data.openTime || "09:00"}
                  onChange={(e) => onChange({ ...data, openTime: e.target.value })}
                  style={{ maxWidth: 140 }}
                />
                <input
                  type="time"
                  value={data.closeTime || "23:00"}
                  onChange={(e) => onChange({ ...data, closeTime: e.target.value })}
                  style={{ maxWidth: 140 }}
                />
              </>
            ) : null}
          </div>

          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
            Isso vai virar base dos horários da Agenda e da página pública da Arena.
          </div>
        </div>
      </div>
    );
  }

  // player/organizer
  return (
    <div className={styles.fields}>
      <div className={styles.field}>
        <label>Nome de Craque</label>
        <input
          type="text"
          value={data.name || ""}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Como você é conhecido na quadra"
        />
      </div>

      <div className={styles.field}>
        <label>Posição Preferida</label>
        <select
          value={data.position || ""}
          onChange={(e) => onChange({ ...data, position: e.target.value })}
        >
          <option value="">Selecione sua posição</option>
          <option value="Goleiro">Goleiro</option>
          <option value="Fixo">Fixo</option>
          <option value="Ala">Ala</option>
          <option value="Pivô">Pivô</option>
        </select>
      </div>

      <div className={styles.field}>
        <label>WhatsApp</label>
        <input
          type="text"
          value={data.phone || ""}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          placeholder="(41) 9xxxx-xxxx"
        />
      </div>
    </div>
  );
}
