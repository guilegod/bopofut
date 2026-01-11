import styles from "./OwnerManagement.module.css";

export default function OwnerManagement({
  role,
  onOpenOrganizerPanel,
  onOpenArenaPanel,
  onOpenAgenda,
  onOpenFinance,
  onOpenPromotions,
  onOpenAccountSettings,
}) {
  const isOrganizer = role === "owner";
  const isArenaOwner = role === "arena_owner";

  const options = isArenaOwner
    ? [
        {
          label: "Painel da Arena",
          icon: "🏟️",
          action: () => onOpenArenaPanel?.(),
        },
        {
          label: "Agenda & Horários",
          icon: "🗓️",
          action: () => onOpenAgenda?.(),
        },
        {
          label: "Relatórios de Receita",
          icon: "💰",
          action: () => onOpenFinance?.(),
        },
        {
          label: "Promoções & Cupons",
          icon: "🏷️",
          action: () => onOpenPromotions?.(),
        },
        {
          label: "Configurações de Conta",
          icon: "⚙️",
          action: () => onOpenAccountSettings?.(),
        },
      ]
    : [
        {
          label: "Painel do Organizador",
          icon: "🎯",
          action: () => onOpenOrganizerPanel?.(),
        },
        {
          label: "Minhas Peladas",
          icon: "⚽",
          action: () => onOpenOrganizerPanel?.(),
        },
        {
          label: "Receitas & Taxas",
          icon: "💰",
          action: () => onOpenFinance?.(),
        },
        {
          label: "Cupons (Em breve)",
          icon: "🏷️",
          action: () => onOpenPromotions?.(),
          soon: true,
        },
        {
          label: "Configurações de Conta",
          icon: "⚙️",
          action: () => onOpenAccountSettings?.(),
          soon: true,
        },
      ];

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h3 className={styles.title}>
          {isArenaOwner ? "Gerenciamento da Arena" : "Gerenciamento"}
        </h3>

        <span className={styles.badge}>
          {isArenaOwner ? "Acesso Arena" : "Acesso Organizador"}
        </span>
      </div>

      <div className={styles.list}>
        {options.map((o) => (
          <button
            key={o.label}
            className={styles.item}
            onClick={o.action}
            type="button"
            title={o.soon ? "Em breve" : o.label}
          >
            <span className={styles.left}>
              <span className={styles.icon}>{o.icon}</span>
              {o.label}
            </span>

            <span className={styles.arrow}>{o.soon ? "…" : "→"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
