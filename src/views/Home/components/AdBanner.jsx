import styles from "./AdBanner.module.css";

export default function AdBanner() {
  return (
    <section className={styles.banner} aria-label="Espaço publicitário">
      <span className={styles.text}>Espaço Publicitário</span>
    </section>
  );
}
