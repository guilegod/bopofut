import styles from "../matchCreator.module.css";

export default function SummaryCard({ data }) {
  const total = (Number(data.maxPlayers) || 0) * (Number(data.pricePerPlayer) || 0);
  const totalBR = total.toFixed(2).replace(".", ",");

  return (
    <div className={styles.summary}>
      <p>Resumo da Partida • {data.date}</p>
      <strong>Total Arrecadado: R$ {totalBR}</strong>
    </div>
  );
}
