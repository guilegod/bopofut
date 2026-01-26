import { useEffect, useMemo, useState } from "react";

import styles from "../SquarePage.module.css";

import { badgeClass, btnClass } from "../utils/ui";
import * as XpStore from "../utils/xpStore.js";

import PlayerSectionOverview from "./PlayerSectionOverview.jsx";
import PlayerSectionTeams from "./PlayerSectionTeams.jsx";
import PlayerSectionAchievements from "./PlayerSectionAchievements.jsx";

// ✅ Social (mock) — reaproveita o que você já usa no Friends
import {
  areFriends,
  hasPendingRequest,
  sendFriendRequest,
} from "../../../../../services/publicCourtsMock.js";

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={btnClass(active ? "primary" : "ghost")}
      style={{ borderRadius: 999, whiteSpace: "nowrap" }}
    >
      {children}
    </button>
  );
}

export default function PlayerProfile({
  squareId,
  player,          // { userId, name, avatar, level, xp, ... }
  myUser,          // usuário logado (quem está vendo)
  teams = [],      // lista de times da praça
  onBack,          // voltar pra tela anterior
  onGoChallenges,  // (opcional) ir pra aba desafios já com o player selecionado
}) {
  const myId = myUser?.id;
  const targetId = player?.userId;

  const [tab, setTab] = useState("overview"); // overview | teams | achievements

  // ✅ rank do player no leaderboard dessa praça
  const rank = useMemo(() => {
    if (!squareId || !targetId) return null;
    return XpStore.getRankOfUser(squareId, targetId);
  }, [squareId, targetId]);

  // ✅ social states
  const [bump, setBump] = useState(0);
  function refreshSocial() {
    setBump((x) => x + 1);
  }

  const isMe = myId && targetId && myId === targetId;

  const friendsNow = useMemo(() => {
    if (!myId || !targetId || isMe) return false;
    return areFriends(myId, targetId);
  }, [myId, targetId, isMe, bump]);

  const pending = useMemo(() => {
    if (!myId || !targetId || isMe) return false;
    return hasPendingRequest(myId, targetId);
  }, [myId, targetId, isMe, bump]);

  function handleAddFriend(p) {
    if (!myId) return alert("Faça login para adicionar amigos.");
    if (!p?.userId) return;
    if (p.userId === myId) return;
    if (areFriends(myId, p.userId)) return refreshSocial();
    if (hasPendingRequest(myId, p.userId)) return refreshSocial();

    sendFriendRequest(myId, p.userId);
    refreshSocial();
    alert("Pedido de amizade enviado ✅");
  }

  function handleChallenge(p) {
    // ✅ você decide: pode abrir aba desafios na própria praça
    // e já selecionar o time + alvo
    if (!myId) return alert("Faça login para desafiar.");
    if (!p?.userId) return;
    if (p.userId === myId) return;

    onGoChallenges?.(p); // o pai faz: setTab("challenges") + setChallengeTarget(p)
  }

  // se trocar de player, reseta tab
  useEffect(() => {
    setTab("overview");
  }, [targetId]);

  if (!player) return null;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.title}>👤 Perfil do jogador</div>
          <div className={styles.hint}>
            {player.name}
            {rank ? ` • Ranking #${rank}` : ""}
          </div>
        </div>

        <button type="button" className={btnClass("ghost")} onClick={onBack}>
          ← Voltar
        </button>
      </div>

      {/* Status badges */}
      <div className={styles.menuMeta} style={{ marginBottom: 10 }}>
        {isMe ? <span className={badgeClass("info")}>Você</span> : null}
        {!isMe && friendsNow ? <span className={badgeClass("info")}>🤝 Amigos</span> : null}
        {!isMe && !friendsNow && pending ? <span className={badgeClass("muted")}>⏳ Pedido enviado</span> : null}
      </div>

      {/* Tabs */}
      <div className={styles.tabs} style={{ marginBottom: 12 }}>
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          🧾 Resumo
        </TabButton>
        <TabButton active={tab === "teams"} onClick={() => setTab("teams")}>
          🛡️ Times
        </TabButton>
        <TabButton active={tab === "achievements"} onClick={() => setTab("achievements")}>
          🏅 Conquistas
        </TabButton>
      </div>

      {/* Content */}
      {tab === "overview" ? (
        <PlayerSectionOverview
          player={player}
          rank={rank}
          isFriend={friendsNow}
          onAddFriend={handleAddFriend}
          onChallenge={handleChallenge}
        />
      ) : null}

      {tab === "teams" ? (
        <PlayerSectionTeams teams={teams} userId={targetId} />
      ) : null}

      {tab === "achievements" ? (
        <PlayerSectionAchievements squareId={squareId} userId={targetId} />
      ) : null}

      <div className={styles.hint} style={{ marginTop: 10 }}>
        Dica: clique em jogadores na Presença/Chat/Ranking pra abrir este perfil.
      </div>
    </div>
  );
}
