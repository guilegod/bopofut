import styles from "../friends.module.css";

export default function SearchBar() {
  return (
    <input
      type="text"
      placeholder="Buscar amigos..."
      className={styles.search}
    />
  );
}
