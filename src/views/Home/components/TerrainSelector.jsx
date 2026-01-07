import styles from "./TerrainSelector.module.css";

export default function TerrainSelector({ activeType, onChangeType }) {
  return (
    <div className={styles.grid}>
      <button
        type="button"
        onClick={() => onChangeType("fut7")}
        className={`${styles.card} ${
          activeType === "fut7" ? styles.activeGreen : styles.inactive
        }`}
      >
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800&h=520"
          alt="Fut7 - Gramado Sintético"
          className={styles.img}
        />
        <div className={styles.overlay}>
          <p className={styles.title}>Fut7</p>
          <p className={styles.sub}>Sintético</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChangeType("futsal")}
        className={`${styles.card} ${
          activeType === "futsal" ? styles.activeGold : styles.inactive
        }`}
      >
        <img
          src="https://lncimg.lance.com.br/cdn-cgi/image/width=950,quality=75,fit=pad,format=webp/uploads/2022/01/28/61f45fadcf18e.jpeg"
          alt="Futsal - Quadra de Salão"
          className={styles.img}
        />
        <div className={styles.overlay}>
          <p className={styles.title}>Futsal</p>
          <p className={styles.sub}>Salão</p>
        </div>
      </button>
    </div>
  );
}
