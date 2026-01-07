import styles from "../MatchDetails.module.css";

export default function RulesTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className={styles.panel}>
        <h3 style={{ marginTop: 0 }}>Código de Conduta</h3>
        <p className={styles.muted}>
          Respeito acima de tudo. Sem briga, sem treta, sem falta de educação.
        </p>
      </div>

      <div className={styles.panel}>
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <li><b>Pontualidade:</b> chegue 15 min antes.</li>
          <li><b>Calçado:</b> society no sintético, futsal no salão.</li>
          <li><b>Cancelamento:</b> avise com antecedência.</li>
          <li><b>Fair play:</b> jogo limpo sempre.</li>
        </ul>
      </div>
    </div>
  );
}
