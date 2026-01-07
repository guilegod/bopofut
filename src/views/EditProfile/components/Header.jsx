import styles from "../editProfile.module.css";

export default function Header({ onBack }) {
  return (
    <header className={styles.header}>
      <button onClick={onBack} className={styles.back}>←</button>
      <h2>Editar Perfil</h2>
    </header>
  );
}
