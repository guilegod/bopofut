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

function normStatus(s) {
  return String(s || "").toUpperCase().trim();
}

function isCanceledMatch(match) {
  const s = normStatus(match?.status || match?.admin?.status);
  return (
    s === "CANCELED" ||
    s === "CANCELLED" ||
    match?.canceled === true ||
    !!match?.canceledAt
  );
}

function isLockedMatch(match) {
  const s = normStatus(match?.status || match?.admin?.status);
  return ["CANCELED", "CANCELLED", "EXPIRED", "FINISHED"].includes(s) || isCanceledMatch(match);
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function MatchDetails({
  match,
  court,
  user,
  onBack,
  onManageStats,
  onPresenceChange,
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [loadingPresence, setLoadingPresence] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

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

  const isAdmin =
    user?.role === "owner" ||
    user?.role === "admin" ||
    user?.id === match?.organizerId ||
    user?.role === "arena_owner"; // ✅ arena_owner também pode gerenciar

  const canceled = isCanceledMatch(match);
  const locked = isLockedMatch(match);

  // ✅ PREMIUM: lista de presenças com nome/role
  const presenceRows = useMemo(() => {
    const list = Array.isArray(presences) ? presences : [];
    return list
      .map((p) => {
        const fallback = mockUsers.find((u) => String(u.id) === String(p.userId));
        const name = p?.user?.name || fallback?.name || "Jogador";
        const role = p?.user?.role || fallback?.role || "";
        const email = p?.user?.email || fallback?.email || "";
        return { ...p, __name: name, __role: role, __email: email };
      })
      .sort((a, b) => {
        // organizador em cima, depois o usuário logado, depois A-Z
        const aOrg = String(a.userId) === String(match?.organizerId) ? 1 : 0;
        const bOrg = String(b.userId) === String(match?.organizerId) ? 1 : 0;
        if (aOrg !== bOrg) return bOrg - aOrg;

        const aMe = String(a.userId) === String(user?.id) ? 1 : 0;
        const bMe = String(b.userId) === String(user?.id) ? 1 : 0;
        if (aMe !== bMe) return bMe - aMe;

        return String(a.__name).localeCompare(String(b.__name), "pt-BR");
      });
  }, [presences, match?.organizerId, user?.id]);

  // ✅ scroll quando abrir a aba chat
  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab]);

  // ==========================
  // ✅ PRESENÇA (USER)
  // ==========================
  async function handleConfirmJoin() {
    if (isJoined || spotsLeft <= 0 || loadingPresence || locked) return;
    try {
      setLoadingPresence(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}/join`, { method: "POST", token });
      await onPresenceChange?.();
    } catch (e) {
      console.error(e);
      alert(
        "Não consegui confirmar presença.\n\n" +
          "Confere se existe no backend:\nPOST /matches/:id/join"
      );
    } finally {
      setLoadingPresence(false);
    }
  }

  async function handleLeave() {
    if (!isJoined || loadingPresence) return;
    try {
      setLoadingPresence(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}/join`, { method: "DELETE", token });
      await onPresenceChange?.();
    } catch (e) {
      console.error(e);
      alert(
        "Não consegui cancelar minha presença.\n\n" +
          "Confere se existe no backend:\nDELETE /matches/:id/join"
      );
    } finally {
      setLoadingPresence(false);
    }
  }

  // ==========================
  // ✅ ADMIN: remover jogador
  // ==========================
  async function adminRemovePresence(row) {
    if (!isAdmin || adminActionLoading || locked) return;
    const targetUserId = row?.userId;
    if (!targetUserId) return;

    const ok = window.confirm(`Remover ${row?.__name || "jogador"} da pelada?`);
    if (!ok) return;

    try {
      setAdminActionLoading(true);
      const token = getToken();

      // ✅ tenta rotas comuns (fallback)
      // 1) DELETE /matches/:id/presences/:userId
      try {
        await apiRequest(`/matches/${match.id}/presences/${targetUserId}`, {
          method: "DELETE",
          token,
        });
      } catch (err1) {
        // 2) DELETE /matches/:id/presences/:presenceId
        if (row?.id) {
          try {
            await apiRequest(`/matches/${match.id}/presences/${row.id}`, {
              method: "DELETE",
              token,
            });
          } catch (err2) {
            // 3) fallback "kick"
            await apiRequest(`/matches/${match.id}/kick/${targetUserId}`, {
              method: "DELETE",
              token,
            });
          }
        } else {
          // 3) fallback "kick"
          await apiRequest(`/matches/${match.id}/kick/${targetUserId}`, {
            method: "DELETE",
            token,
          });
        }
      }

      await onPresenceChange?.();
      setInviteFeedback(`Removido: ${row?.__name || "jogador"} ✅`);
      setTimeout(() => setInviteFeedback(null), 2500);
    } catch (e) {
      console.error(e);
      alert(
        "Não consegui remover o jogador.\n\n" +
          "Me diga qual rota existe no seu backend. Sugestões:\n" +
          "DELETE /matches/:id/presences/:userId\n" +
          "ou DELETE /matches/:id/presences/:presenceId\n" +
          "ou DELETE /matches/:id/kick/:userId"
      );
    } finally {
      setAdminActionLoading(false);
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

  // ==========================
  // ✅ ADMIN ACTIONS
  // ==========================
  async function adminStart() {
    if (!isAdmin || adminActionLoading) return;
    try {
      setAdminActionLoading(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}/start`, { method: "PATCH", token });
      await onPresenceChange?.();
      setInviteFeedback("Partida iniciada ✅");
      setTimeout(() => setInviteFeedback(null), 2500);
    } catch (e) {
      console.error(e);
      alert("Não consegui iniciar.\n\nConfere: PATCH /matches/:id/start");
    } finally {
      setAdminActionLoading(false);
    }
  }

  async function adminFinish() {
    if (!isAdmin || adminActionLoading) return;
    try {
      setAdminActionLoading(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}/finish`, { method: "PATCH", token });
      await onPresenceChange?.();
      setInviteFeedback("Partida finalizada ✅");
      setTimeout(() => setInviteFeedback(null), 2500);
    } catch (e) {
      console.error(e);
      alert("Não consegui finalizar.\n\nConfere: PATCH /matches/:id/finish");
    } finally {
      setAdminActionLoading(false);
    }
  }

  async function adminExpire() {
    if (!isAdmin || adminActionLoading) return;
    try {
      setAdminActionLoading(true);
      const token = getToken();
      try {
        await apiRequest(`/matches/${match.id}/expire`, { method: "PATCH", token });
      } catch (err) {
        await apiRequest(`/matches/${match.id}`, { method: "GET", token });
      }
      await onPresenceChange?.();
      setInviteFeedback("Partida expirada/atualizada ✅");
      setTimeout(() => setInviteFeedback(null), 2500);
    } catch (e) {
      console.error(e);
      alert("Não consegui expirar/atualizar.\n\nSugestão: PATCH /matches/:id/expire");
    } finally {
      setAdminActionLoading(false);
    }
  }

  async function adminCancel() {
    if (!isAdmin || adminActionLoading) return;
    try {
      setAdminActionLoading(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}/cancel`, { method: "PATCH", token });
      await onPresenceChange?.();
      setInviteFeedback("Partida cancelada ✅");
      setTimeout(() => setInviteFeedback(null), 2500);
    } catch (e) {
      console.error(e);
      alert("Não consegui cancelar.\n\nConfere: PATCH /matches/:id/cancel");
    } finally {
      setAdminActionLoading(false);
    }
  }

  async function adminUncancel() {
    if (!isAdmin || adminActionLoading) return;
    try {
      setAdminActionLoading(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}/uncancel`, { method: "PATCH", token });
      await onPresenceChange?.();
      setInviteFeedback("Partida reativada ✅");
      setTimeout(() => setInviteFeedback(null), 2500);
    } catch (e) {
      console.error(e);
      alert("Não consegui reativar.\n\nConfere: PATCH /matches/:id/uncancel");
    } finally {
      setAdminActionLoading(false);
    }
  }

  async function adminDelete() {
    if (!isAdmin || adminActionLoading) return;

    const ok = window.confirm(
      "Tem certeza que quer EXCLUIR essa partida?\n\n⚠️ Isso apaga do sistema. Se preferir, use Cancelar."
    );
    if (!ok) return;

    try {
      setAdminActionLoading(true);
      const token = getToken();
      await apiRequest(`/matches/${match.id}`, { method: "DELETE", token });
      await onPresenceChange?.();
      onBack?.();
    } catch (e) {
      console.error(e);
      alert("Não consegui excluir.\n\nConfere: DELETE /matches/:id");
    } finally {
      setAdminActionLoading(false);
    }
  }

  const matchDateTimeLabel = formatDateTime(match?.date);

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

      {/* 💸 Preço + origem */}
      <div
        style={{
          marginTop: 10,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.03)",
          padding: "10px 12px",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontWeight: 900 }}>
            💸{" "}
            {match?.pricePerPlayer !== undefined && match?.pricePerPlayer !== null
              ? `${Number(match.pricePerPlayer)} / atleta`
              : "Preço a confirmar"}
          </span>

          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              fontWeight: 850,
              opacity: 0.92,
            }}
            title={
              String(match?.organizer?.role || "").toLowerCase() === "arena_owner"
                ? "Este valor é o preço oficial da arena."
                : "Este valor foi definido pelo organizador da partida."
            }
          >
            {String(match?.organizer?.role || "").toLowerCase() === "arena_owner"
              ? "🏟️ Preço da Arena"
              : "👤 Preço do Organizador"}
          </span>
        </div>

        <div style={{ opacity: 0.75, fontSize: 12 }}>
          {matchDateTimeLabel ? `🗓️ ${matchDateTimeLabel}` : "🗓️ Data/Hora a confirmar"}
        </div>
      </div>

      {/* ✅ CHAT agora é do backend, então não depende de match.messages */}
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} hasChat />

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
            isAdmin={isAdmin}
            canceled={canceled}
            locked={locked}
            adminLoading={adminActionLoading}
            onStartMatch={adminStart}
            onFinishMatch={adminFinish}
            onExpireMatch={adminExpire}
            onCancelMatch={adminCancel}
            onUncancelMatch={adminUncancel}
            onDeleteMatch={adminDelete}
            // ✅ PREMIUM: tabela de presenças
            presenceRows={presenceRows}
            onRemovePresence={adminRemovePresence}
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

        {/* ✅ NOVO: Chat real do backend */}
        {activeTab === "chat" && <ChatTab matchId={match.id} user={user} chatEndRef={chatEndRef} />}
      </div>
    </div>
  );
}
