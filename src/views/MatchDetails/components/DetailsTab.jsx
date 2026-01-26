import styles from "../MatchDetails.module.css";
import InvitePanel from "./InvitePanel.jsx";

function moneyBRL(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function initials(name) {
  const n = String(name || "").trim();
  if (!n) return "??";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts[1]?.[0] || parts[0]?.[1] || "";
  return (a + b).toUpperCase();
}

export default function DetailsTab({
  match,
  court,
  user,
  isJoined,
  spotsLeft,

  inviteFeedback,
  copyFeedback,

  onConfirmJoin,
  onLeave,

  onManageStats,

  onCopyLink,
  onWhatsAppShare,

  availableFriends,
  onInviteFriend,
  showFriendSelector,
  setShowFriendSelector,

  isAdmin,

  canceled,
  locked,
  adminLoading,

  onStartMatch,
  onFinishMatch,
  onExpireMatch,
  onCancelMatch,
  onUncancelMatch,
  onDeleteMatch,

  // ✅ PREMIUM
  presenceRows = [],
  onRemovePresence,
}) {
  const presences = Array.isArray(match?.presences) ? match.presences : [];
  const maxPlayers = Number.isFinite(Number(match?.maxPlayers)) ? Number(match.maxPlayers) : 14;
  const joinedCount = presences.length;
  const pricePerPlayer = Number.isFinite(Number(match?.pricePerPlayer)) ? Number(match.pricePerPlayer) : 0;

  const canJoin = !locked && !canceled;
  const canManage = Boolean(isAdmin);

  return (
    <div className={styles.tabInner}>
      {/* ✅ CARD “AÇÃO PRINCIPAL” */}
      <div className={styles.card}>
        <div className={styles.cardRow}>
          <div>
            <div className={styles.kpiLabel}>Participantes</div>
            <div className={styles.kpiValue}>
              {joinedCount} / {maxPlayers}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className={styles.kpiLabel}>Valor / atleta</div>
            <div className={styles.kpiValue}>{moneyBRL(pricePerPlayer)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          {!isJoined ? (
            <button
              className={styles.primaryBtn}
              onClick={onConfirmJoin}
              disabled={!canJoin || spotsLeft <= 0}
              title={!canJoin ? "Partida bloqueada/cancelada" : spotsLeft <= 0 ? "Lotado" : "Confirmar presença"}
            >
              ✅ Confirmar presença
            </button>
          ) : (
            <button
              className={styles.secondaryBtn}
              onClick={onLeave}
              disabled={!canJoin}
              title={!canJoin ? "Partida bloqueada/cancelada" : "Cancelar minha presença"}
            >
              ❌ Cancelar presença
            </button>
          )}

          <button className={styles.ghostBtn} onClick={() => onManageStats?.("unofficial")} disabled={!isJoined}>
            ⚽ Stats (minhas)
          </button>

          {canManage && (
            <button className={styles.ghostBtn} onClick={() => onManageStats?.("official")} disabled={adminLoading}>
              🛡️ Stats oficiais
            </button>
          )}
        </div>

        <div style={{ marginTop: 10, opacity: 0.85, fontSize: 13 }}>
          {canceled ? "🚫 Partida cancelada/expirada/finalizada." : null}
          {!canceled && locked ? "🔒 Partida bloqueada para ações agora." : null}
          {!canceled && !locked && spotsLeft <= 0 ? "⚠️ Lotado." : null}
        </div>
      </div>

      {/* ✅ PREMIUM: LISTA/TABELA DE CONFIRMADOS */}
      <div className={styles.card} style={{ marginTop: 14 }}>
        <div className={styles.sectionTitle} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span>Convocados</span>
          <span style={{ opacity: 0.75, fontSize: 12 }}>
            {joinedCount} de {maxPlayers} vagas
          </span>
        </div>

        {presenceRows.length === 0 ? (
          <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
            Nenhum confirmado ainda. Seja o primeiro ✅
          </div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {presenceRows.map((p) => {
              const isMe = String(p.userId) === String(user?.id);
              const isOrganizer = String(p.userId) === String(match?.organizerId);

              return (
                <div
                  key={p.id || `${p.userId}-${p.createdAt || ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        flex: "0 0 auto",
                      }}
                      title={p.__name}
                    >
                      {initials(p.__name)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.__name} {isMe ? "• Você" : ""}
                      </div>

                      <div style={{ opacity: 0.75, fontSize: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span>✅ Confirmado</span>
                        {isOrganizer ? <span style={{ opacity: 0.95 }}>👑 Organizador</span> : null}
                        {p.__role ? <span>• {String(p.__role).replace(/_/g, " ")}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {isMe ? (
                      <button
                        className={styles.secondaryBtn}
                        onClick={onLeave}
                        disabled={!canJoin}
                        title={!canJoin ? "Partida bloqueada/cancelada" : "Cancelar minha presença"}
                      >
                        ❌ Cancelar
                      </button>
                    ) : null}

                    {canManage && !isMe ? (
                      <button
                        className={styles.dangerBtn}
                        onClick={() => onRemovePresence?.(p)}
                        disabled={adminLoading || locked}
                        title={locked ? "Partida bloqueada" : "Remover jogador"}
                      >
                        🧹 Remover
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ ADMIN / ORGANIZADOR / ARENA_OWNER */}
      {canManage && (
        <div className={styles.card} style={{ marginTop: 14 }}>
          <div className={styles.sectionTitle}>Controle da Partida</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button className={styles.primaryBtn} onClick={onStartMatch} disabled={adminLoading || canceled}>
              ▶️ Start
            </button>

            <button className={styles.secondaryBtn} onClick={onFinishMatch} disabled={adminLoading || canceled}>
              🏁 Finish
            </button>

            <button className={styles.secondaryBtn} onClick={onCancelMatch} disabled={adminLoading}>
              ❌ Cancelar
            </button>

            <button className={styles.ghostBtn} onClick={onUncancelMatch} disabled={adminLoading}>
              ♻️ Reativar
            </button>

            <button className={styles.ghostBtn} onClick={onExpireMatch} disabled={adminLoading}>
              ⏳ Expirar
            </button>

            <button className={styles.dangerBtn} onClick={onDeleteMatch} disabled={adminLoading}>
              🗑️ Deletar
            </button>
          </div>
        </div>
      )}

      {/* ✅ CONVIDAR / LINK / WHATS */}
      <InvitePanel
        match={match}
        court={court}
        user={user}
        onCopyLink={onCopyLink}
        onWhatsAppShare={onWhatsAppShare}
        inviteFeedback={inviteFeedback}
        copyFeedback={copyFeedback}
        availableFriends={availableFriends}
        onInviteFriend={onInviteFriend}
        showFriendSelector={showFriendSelector}
        setShowFriendSelector={setShowFriendSelector}
      />
    </div>
  );
}
