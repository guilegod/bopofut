import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./MatchDetails.module.css";
import { mockUsers } from "../../mockData";
import Header from "./components/Header.jsx";
import Tabs from "./components/Tabs.jsx";
import DetailsTab from "./components/DetailsTab.jsx";
import InfoTab from "./components/InfoTab.jsx";
import RulesTab from "./components/RulesTab.jsx";
import ChatTab from "./components/ChatTab.jsx";

function clean(v) {
  return String(v ?? "").replace(/\r?\n/g, "").trim();
}

export default function MatchDetails({
  match,
  court,
  user,
  onJoin,
  onLeave,
  onBack,
  onManageStats,
  onNewMessage,
}) {
  const [activeTab, setActiveTab] = useState("details");

  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [showFriendSelector, setShowFriendSelector] = useState(false);

  const chatEndRef = useRef(null);

  const currentPlayers = Array.isArray(match?.currentPlayers)
    ? match.currentPlayers
    : [];

  const maxPlayers = Number(match?.maxPlayers ?? 0);
  const isJoined = currentPlayers.includes(user?.id);
  const spotsLeft = Math.max(0, maxPlayers - currentPlayers.length);

  // =============================
  // 📍 DADOS CORRETOS DE LOCAL
  // =============================
  const arenaName = clean(
    court?.displayName ||
    court?.uiName ||
    court?.name ||
    "Arena"
  ).replace(/\((.*?)\)/g, "").trim();

  const arenaAddress = clean(
    [court?.address, court?.city, court?.state].filter(Boolean).join(", ")
  );

  // Endereço REAL da partida (criado no MatchCreator)
  const matchAddress = clean(match?.matchAddress || "");

  // O que os jogadores veem como local:
  const placeAddress = matchAddress || arenaAddress || "Local a confirmar";

  // Nome da partida
  const placeName = clean(match?.title || "Pelada");

  // =============================
  // 🌍 MAPS
  // =============================
  const mapsQuery = encodeURIComponent(`${placeName} ${placeAddress}`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const mapEmbedUrl = useMemo(() => {
    return `https://maps.google.com/maps?q=${mapsQuery}&z=15&output=embed`;
  }, [mapsQuery]);

  // =============================
  // Friends (mock)
  // =============================
  const availableFriends = useMemo(() => {
    return mockUsers.filter(
      (u) =>
        u.id !== user?.id &&
        u.role === "player" &&
        !currentPlayers.includes(u.id)
    );
  }, [user?.id, currentPlayers]);

  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, match?.messages]);

  function handleConfirmJoin() {
    if (isJoined || spotsLeft <= 0) return;
    onJoin?.(match.id, [user.id]);
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

      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasChat={!!match?.messages?.length}
      />

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
            onLeave={() => onLeave?.(match.id)}
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
          <ChatTab
            match={match}
            user={user}
            onNewMessage={onNewMessage}
            chatEndRef={chatEndRef}
          />
        )}
      </div>
    </div>
  );
}
