import styles from "./Maintenance.module.css";

export default function Maintenance() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>BP</div>

        <h1 className={styles.title}>BoraPô</h1>
        <p className={styles.text}>
          Estamos ajustando os últimos detalhes 🚧
          <br />
          Volte em breve.
        </p>

        <div className={styles.note}>
          Se você precisa acessar agora, fale comigo no WhatsApp.
        </div>
      </div>
    </div>
  );
}
