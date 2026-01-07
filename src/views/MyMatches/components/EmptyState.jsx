import styles from "../myMatches.module.css";

export default function EmptyState({ filter = "ALL" }) {
  const msg =
    filter === "LIVE"
      ? "Nenhuma partida em andamento agora."
      : filter === "UPCOMING"
      ? "Você não tem partidas agendadas no momento."
      : filter === "FINISHED"
      ? "Você ainda não finalizou nenhuma partida."
      : filter === "CANCELLED"
      ? "Nenhuma partida cancelada por aqui."
      : "Você ainda não está inscrito em nenhuma partida.";

  const hint =
    filter === "FINISHED"
      ? "Finalize uma partida no Admin que ela aparece aqui automaticamente."
      : "Bora pro jogo!";

  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>⚽</div>
      <p>{msg}</p>
      <span>{hint}</span>
    </div>
  );
}
