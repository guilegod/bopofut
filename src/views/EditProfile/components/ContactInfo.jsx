import styles from "../editProfile.module.css";

export default function ContactInfo({ email, phone }) {
  return (
    <div className={styles.contact}>
      <h3>Informações de Contato</h3>

      <div className={styles.contactBox}>
        <div>
          <span>E-mail</span>
          <strong>{email}</strong>
        </div>
        <div>
          <span>Telefone / WhatsApp</span>
          <strong>{phone}</strong>
        </div>
      </div>

      <p className={styles.note}>
        Para alterar e-mail ou telefone, entre em contato com o suporte da Arena.
      </p>
    </div>
  );
}
