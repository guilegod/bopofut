import styles from "../EditProfile.module.css";

export default function Header({ onBack, title = "Editar Perfil", subtitle = "" }) {
  return (
    <header className={styles.header}>
      <button onClick={onBack} className={styles.back} type="button" aria-label="Voltar">
        ←
      </button>

      <div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {subtitle ? (
          <div style={{ opacity: 0.7, fontSize: 13, marginTop: 2 }}>{subtitle}</div>
        ) : null}
      </div>
    </header>
  );
}
