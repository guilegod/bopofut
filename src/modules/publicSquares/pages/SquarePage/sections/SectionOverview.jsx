import styles from "../SquarePage.module.css";
import { badgeClass, btnClass, toastCopy } from "../utils/ui";

export default function SectionOverview({
  court,
  isLive,
  presenceCount,
  iAmHere,
  user,
  checkinLoading,
  geoHint,
  deepLink,
  mapsMetaLabel,
  onCheckIn,
  onCheckOut,
  onGoTab,
}) {
  const canUse = !!user?.id;

  return (
    <div className={styles.grid}>
      {/* STATUS AGORA (foco em ação) */}
      <div className={styles.card}>
        <div className={styles.sectionHeaderCompact}>
          <div className={styles.title}>📍 Status agora</div>
          <span className={badgeClass(isLive ? "live" : "muted")}>
            {isLive ? `🟢 ${presenceCount} online` : "⚪ offline"}
          </span>
        </div>

        <div className={styles.hint}>
          {court?.address || "Endereço não informado"}
          {court?.city ? ` — ${court.city}` : ""}
        </div>

        <div className={styles.overviewActions}>
          {!canUse ? (
            <div className={styles.softCard} style={{ marginTop: 12 }}>
              <div className={styles.title}>🔒 Login necessário</div>
              <div className={styles.hint}>Entre para marcar presença e interagir na praça.</div>
            </div>
          ) : (
            <>
              {!iAmHere ? (
                <button
                  type="button"
                  className={btnClass("primary")}
                  onClick={onCheckIn}
                  disabled={checkinLoading}
                  title="Marcar presença por 20 min"
                >
                  ✅ Estou aqui agora
                </button>
              ) : (
                <button type="button" className={btnClass("danger")} onClick={onCheckOut}>
                  🚪 Sair da praça
                </button>
              )}

              <button
                type="button"
                className={btnClass("soft")}
                onClick={() => toastCopy(mapsMetaLabel || court?.address || "", "Endereço copiado ✅")}
              >
                📋 Copiar endereço
              </button>

              <button type="button" className={btnClass("ghost")} onClick={() => toastCopy(deepLink, "Link copiado ✅")}>
                🔗 Copiar link
              </button>
            </>
          )}
        </div>

        <div className={styles.hint} style={{ marginTop: 10 }}>
          ⏱️ Presença dura <b>20 min</b> e renova quando você marcar de novo.
        </div>

        {geoHint ? (
          <div className={styles.softCard} style={{ marginTop: 12 }}>
            <div className={styles.title}>📡 Localização</div>
            <div className={styles.hint}>{geoHint}</div>
          </div>
        ) : null}
      </div>

      {/* AÇÕES RÁPIDAS (navegação fácil) */}
      <div className={styles.card}>
        <div className={styles.sectionHeaderCompact}>
          <div className={styles.title}>⚡ Ações rápidas</div>
          <span className={badgeClass("muted")}>atalhos</span>
        </div>

        <div className={styles.quickGrid}>
          <button type="button" className={btnClass("soft")} onClick={() => onGoTab?.("local")}>
            📍 Abrir Local
          </button>
          <button type="button" className={btnClass("soft")} onClick={() => onGoTab?.("presence")}>
            👥 Ver Online
          </button>
          <button type="button" className={btnClass("soft")} onClick={() => onGoTab?.("chat")}>
            💬 Abrir Chat
          </button>
        </div>
      </div>
    </div>
  );
}
