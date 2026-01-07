import styles from "../wallet.module.css";

const transactions = [
  { label: "Entrada: Arena Central", val: -25, date: "Ontem", time: "18:45" },
  { label: "Recarga Bópô PIX", val: 100, date: "12 Mar", time: "10:20" },
];

export default function TransactionsList() {
  return (
    <section className={styles.section}>
      <h3>Uso dos Créditos</h3>

      <div className={styles.list}>
        {transactions.map((t, i) => (
          <div key={i} className={styles.item}>
            <div>
              <strong>{t.label}</strong>
              <span>{t.date} às {t.time}</span>
            </div>

            <span className={t.val < 0 ? styles.negative : styles.positive}>
              {t.val < 0 ? "-" : "+"} R$ {Math.abs(t.val).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <p className={styles.footerNote}>
        Os créditos Bópô Fut não possuem data de expiração.
      </p>
    </section>
  );
}
