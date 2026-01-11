import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./MatchDetails.module.css";
import { mockUsers } from "../../mockData";
import Header from "./components/Header.jsx";
import Tabs from "./components/Tabs.jsx";
import DetailsTab from "./components/DetailsTab.jsx";
import InfoTab from "./components/InfoTab.jsx";
import RulesTab from "./components/RulesTab.jsx";
import ChatTab from "./components/ChatTab.jsx";
import { apiRequest } from "../../services/api.js";
import { getToken } from "../../services/authService.js";

function clean(v) {
  return String(v ?? "").replace(/\r?\n/g, "").trim();
}

export default function MatchDetails({
  match,
  court,
  user,
  onBack,
  onManageStats,
  onNewMessage,
  onPresenceChange, // 🔥 novo
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [loadingPresence, setLoadingPresence] = useState(false);

  const chatEndRef = useRef(null);

  const presences = Array.isArray(match?.presences) ? match.presences : [];
  const currentPlayers = presences.map((p) => p.userId);
  const maxPlayers = Number(match?.maxPlayers ?? 0);

  const isJoined = currentPlayers.includes(user?.id);
  const spotsLeft = Math.max(0, maxPlayers - currentPlayers.length);

  const arenaName = clean(court?.displayName || court?.uiName || court?.name || "Arena")
    .replace(/\((.*?)\)/g, "")
    .trim();

  const arenaAddress = clean([court?.address, court?.city, court?.state].filter(Boolean).join(", "));
  const matchAddress = clean(match?.matchAddress || "");
  const placeAddress = matchAddress || arenaAddress || "Local a confirmar";
  const placeName = clean(match?.title || "Pelada");

  const mapsQuery = encodeURIComponent(`${placeName} ${placeAddress}`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapEmbedUrl = useMemo(() => {
    return `https://maps.google.com/maps?q=${mapsQuery}&z=15&output=embed`;
  }, [mapsQuery]);

  const availableFriends = useMemo(() => {
    return mockUsers.filter(
      (u) =>
        u.id !== user?.id &&
        (u.role === "player" || u.role === "user") &&
        !currentPlayers.includes(u.id)
    );
  }, [user?.id, currentPlayers]);

  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, match?.messages]);

  async function handleConfirmJoin() {
    if (isJoined || spotsLeft <= 0 || loadingPresence) return;
    try {
      setLoadingPresence(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}/join`, { method: "POST", token });
      await onPresenceChange?.();
    } finally {
      setLoadingPresence(false);
    }
  }

  async function handleLeave() {
    if (!isJoined || loadingPresence) return;
    try {
      setLoadingPresence(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}/leave`, { method: "POST", token });
      await onPresenceChange?.();
    } finally {
      setLoadingPresence(false);
    }
  }

  function handleCopyLink() {
    const url = `https://bopofut.app/m/${match.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback("Copiado!");
      setInviteFeedback(null);
      setTimeout(() => setCopyFeedback(null), 2500);
    });
  }

  function handleWhatsAppShare() {
    const url = `https://bopofut.app/m/${match.id}`;
    const text = `⚽ ${placeName}\n📍 ${placeAddress}\n🔗 ${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank");
  }

  function handleInviteFriend(friend) {
    if (!friend) return;
    setInviteFeedback(`Convite enviado para ${friend.name.split(" ")[0]}!`);
    setCopyFeedback(null);
    setTimeout(() => setInviteFeedback(null), 3000);
  }

  function handleOpenMaps() {
    window.open(googleMapsUrl, "_blank");
  }

  return (
    <div className={styles.page}>
      <Header
        court={court}
        match={match}
        onBack={onBack}
        placeName={placeName}
        placeAddress={placeAddress}
        arenaName={arenaName}
      />

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} hasChat={!!match?.messages?.length} />

      <div className={styles.content}>
        {activeTab === "details" && (
          <DetailsTab
            match={match}
            court={court}
            user={user}
            isJoined={isJoined}
            spotsLeft={spotsLeft}
            inviteFeedback={inviteFeedback}
            copyFeedback={copyFeedback}
            onConfirmJoin={handleConfirmJoin}
            onLeave={handleLeave}
            onManageStats={onManageStats}
            onCopyLink={handleCopyLink}
            onWhatsAppShare={handleWhatsAppShare}
            availableFriends={availableFriends}
            onInviteFriend={handleInviteFriend}
            showFriendSelector={showFriendSelector}
            setShowFriendSelector={setShowFriendSelector}
          />
        )}

        {activeTab === "info" && (
          <InfoTab
            match={match}
            court={court}
            placeName={placeName}
            placeAddress={placeAddress}
            mapEmbedUrl={mapEmbedUrl}
            onOpenMaps={handleOpenMaps}
          />
        )}

        {activeTab === "rules" && <RulesTab />}

        {activeTab === "chat" && (
          <ChatTab match={match} user={user} onNewMessage={onNewMessage} chatEndRef={chatEndRef} />
        )}
      </div>
    </div>
  );
}
