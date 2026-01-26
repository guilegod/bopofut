import styles from "../EditProfile.module.css";

export default function ContactInfo({ mode = "player", email, phone }) {
  const isArena = mode === "arena";

  return (
    <div className={styles.contact}>
      <h3>{isArena ? "Contato da Arena" : "Informações de Contato"}</h3>

      <div className={styles.contactBox}>
        <div>
          <span>E-mail</span>
          <strong>{email}</strong>
        </div>
        <div>
          <span>{isArena ? "WhatsApp Comercial" : "WhatsApp"}</span>
          <strong>{phone || "—"}</strong>
        </div>
      </div>

      <p className={styles.note}>
        {isArena
          ? "Esses dados aparecem na página pública da Arena."
          : "Depois a gente cria a área de segurança (senha, e-mail, etc)."}
      </p>
    </div>
  );
}
