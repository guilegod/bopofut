import styles from "../MatchDetails.module.css";
import InvitePanel from "./InvitePanel.jsx";

export default function DetailsTab({
  match,
  court,
  user,
  isJoined,
  spotsLeft,
  onConfirmJoin,
  onLeave,
  onManageStats,
  showFriendSelector,
  setShowFriendSelector,
  copyFeedback,
  inviteFeedback,
  onCopyLink,
  onWhatsAppShare,
  availableFriends,
  onInviteFriend,
}) {
  const isAdmin =
    user?.role === "owner" ||
    user?.role === "admin" ||
    user?.id === match.organizerId;

  function resolvePlayer(presence) {
    const u = presence?.user;

    if (!u) {
      return {
        name: "Convidado",
        avatar: `https://picsum.photos/seed/${presence.userId}/200`,
      };
    }

    return {
      name: u.name,
      avatar: u.avatar || `https://picsum.photos/seed/${u.id}/200`,
    };
  }

  return (
    <div className={styles.detailsStack}>
      <div className={styles.grid2}>
        <div className={styles.panel}>
          <div className={styles.muted}>Data e Hora</div>
          <div className={styles.strong}>
            {match.date} • {match.time}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.muted}>Valor/Atleta</div>
          <div className={styles.priceStrong}>R$ {match.pricePerPlayer},00</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.convocadosHeader}>
          <h3 className={styles.convocadosTitle}>Convocados</h3>
          <div className={styles.convocadosInfo}>
            {match.presences.length} de {match.maxPlayers} vagas
          </div>
        </div>

        <div className={styles.playersGrid}>
          {match.presences.map((presence, i) => {
            const p = resolvePlayer(presence);

            return (
              <div key={`${presence.userId}-${i}`} className={styles.playerPill}>
                <img src={p.avatar} alt={p.name} className={styles.playerAvatar} />
                <strong className={styles.playerName}>{p.name}</strong>
              </div>
            );
          })}
        </div>

        {spotsLeft > 0 && !isJoined && (
          <div className={styles.ctaRow}>
            <button className={styles.btnPrimary} onClick={onConfirmJoin}>
              Confirmar Presença
            </button>
          </div>
        )}
      </div>

      <InvitePanel
        copyFeedback={copyFeedback}
        inviteFeedback={inviteFeedback}
        onWhatsAppShare={onWhatsAppShare}
        showFriendSelector={showFriendSelector}
        setShowFriendSelector={setShowFriendSelector}
        onCopyLink={onCopyLink}
        availableFriends={availableFriends}
        onInviteFriend={onInviteFriend}
      />

      <div className={styles.actionsStack}>
        {isJoined ? (
          <button className={styles.btnDanger} onClick={onLeave}>
            Sair da Pelada
          </button>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={onConfirmJoin}
            disabled={spotsLeft === 0}
          >
            Confirmar Presença
          </button>
        )}

        {isAdmin && (
          <button
            className={styles.btnSecondary}
            onClick={() => onManageStats(match.id)}
          >
            Gerenciar Súmula (Admin)
          </button>
        )}
      </div>
    </div>
  );
}
