import styles from "./InvitePanel.module.css";

export default function InvitePanel({
  copyFeedback,
  inviteFeedback,
  onWhatsAppShare,
  showFriendSelector,
  setShowFriendSelector,
  onCopyLink,
  availableFriends,
  onInviteFriend,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>Convidar Galera</div>
          <div className={styles.sub}>WhatsApp, Elenco ou Link Direto</div>
        </div>

        {(copyFeedback || inviteFeedback) && (
          <div className={styles.feedback}>
            {copyFeedback ? "Copiado!" : inviteFeedback}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={`${styles.big} ${styles.whats}`} onClick={onWhatsAppShare}>
          WhatsApp
        </button>

        <button
          className={`${styles.big} ${showFriendSelector ? styles.active : styles.neutral}`}
          onClick={() => setShowFriendSelector(!showFriendSelector)}
        >
          Amigos
        </button>

        <button className={styles.small} onClick={onCopyLink}>
          Link
        </button>
      </div>

      {showFriendSelector && (
        <div className={styles.friends}>
          <div className={styles.friendsTitle}>Enviar notificação para:</div>

          <div className={styles.friendsRow}>
            {availableFriends.length ? (
              availableFriends.map((f) => (
                <button key={f.id} className={styles.friendCard} onClick={() => onInviteFriend(f)}>
                  <img src={f.avatar} alt={f.name} className={styles.avatar} />
                  <div className={styles.friendName}>{f.name.split(" ")[0]}</div>
                </button>
              ))
            ) : (
              <div className={styles.none}>Nenhum amigo disponível.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
