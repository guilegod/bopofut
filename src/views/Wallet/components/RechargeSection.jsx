import styles from "../wallet.module.css";

const PRESETS = ["25", "50", "100", "200"];

export default function RechargeSection({ amount, setAmount, onConfirm }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>Recarregar Créditos</h3>
        <span>Válido para todas as quadras</span>
      </div>

      <div className={styles.card}>
        <div className={styles.presets}>
          {PRESETS.map((val) => (
            <button
              key={val}
              className={`${styles.presetBtn} ${amount === val ? styles.active : ""}`}
              onClick={() => setAmount(val)}
            >
              R$ {val}
            </button>
          ))}
        </div>

        <button className={styles.primaryBtn} onClick={onConfirm}>
          Gerar QR Code PIX
        </button>

        <button className={styles.outlineBtn}>
          Cartão de Crédito
        </button>
      </div>
    </section>
  );
}
