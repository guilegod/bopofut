import styles from "./OwnerManagement.module.css";

export default function OwnerManagement() {
  const options = [
    { label: "Perfil da Arena", icon: "🏟️" },
    { label: "Relatórios de Receita", icon: "💰" },
    { label: "Promoções & Cupons", icon: "🏷️" },
    { label: "Configurações de Conta", icon: "⚙️" },
  ];

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h3 className={styles.title}>Gerenciamento</h3>
        <span className={styles.badge}>Acesso Gestor</span>
      </div>

      <div className={styles.list}>
        {options.map((o) => (
          <button key={o.label} className={styles.item}>
            <span className={styles.left}>
              <span className={styles.icon}>{o.icon}</span>
              {o.label}
            </span>
            <span className={styles.arrow}>→</span>
          </button>
        ))}
      </div>
    </section>
  );
}
