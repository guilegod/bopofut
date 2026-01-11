import { ShieldCheck, Clock, Footprints, AlertTriangle, Handshake } from "lucide-react";
import styles from "../MatchDetails.module.css";

export default function RulesTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Cabeçalho */}
      <div className={styles.panel} style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <ShieldCheck size={28} color="var(--primary)" />
        <div>
          <h3 style={{ margin: 0, fontWeight: 900 }}>Código de Conduta</h3>
          <p className={styles.muted} style={{ marginTop: 4 }}>
            Respeito acima de tudo. Sem briga, sem treta, sem falta de educação.
          </p>
        </div>
      </div>

      {/* Regras */}
      <div className={styles.panel}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Rule
            icon={<Clock size={20} />}
            title="Pontualidade"
            desc="Chegue pelo menos 15 minutos antes do horário marcado."
          />

          <Rule
            icon={<Footprints size={20} />}
            title="Calçado"
            desc="Society no sintético, futsal no salão. Use o calçado correto."
          />

          <Rule
            icon={<AlertTriangle size={20} />}
            title="Cancelamento"
            desc="Avise com antecedência para liberar a vaga a outro atleta."
          />

          <Rule
            icon={<Handshake size={20} />}
            title="Fair Play"
            desc="Jogo limpo sempre. Respeito aos colegas e ao organizador."
          />
        </div>
      </div>
    </div>
  );
}

function Rule({ icon, title, desc }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: 12,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ color: "var(--primary)", marginTop: 2 }}>{icon}</div>

      <div>
        <strong style={{ fontSize: 14 }}>{title}</strong>
        <div className={styles.muted} style={{ fontSize: 13, marginTop: 2 }}>
          {desc}
        </div>
      </div>
    </div>
  );
}
