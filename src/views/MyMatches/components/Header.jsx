import styles from "../myMatches.module.css";

export default function Header({
  total = 0,
  liveCount = 0,
  upcomingCount = 0,
  finishedCount = 0,
  cancelledCount = 0,
}) {
  return (
    <div className={styles.header}>
      <h2>Minha Agenda</h2>
      <p>Suas peladas confirmadas e seu histórico.</p>

      <div className={styles.headerStats}>
        <span><b>{total}</b> no total</span>
        <span>• <b>{liveCount}</b> em andamento</span>
        <span>• <b>{upcomingCount}</b> próximas</span>
        <span>• <b>{finishedCount}</b> finalizadas</span>
        <span>• <b>{cancelledCount}</b> canceladas</span>
      </div>
    </div>
  );
}
