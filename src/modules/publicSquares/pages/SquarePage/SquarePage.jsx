import { useEffect, useMemo, useState } from "react";
import styles from "./SquarePage.module.css";

import {
  checkIn,
  checkOut,
  getCourtById,
  isUserPresent,
  listMessages,
  listPresence,
  sendMessage,
} from "../../../../services/publicCourtsMock";

import SectionPhotos from "./sections/SectionPhotos.jsx";
import SectionTeams from "./sections/SectionTeams.jsx";
import SectionTeamDetails from "./sections/SectionTeamDetails.jsx";

import SectionChallenges from "./sections/SectionChallenges.jsx";
import SectionNotifications from "./sections/SectionNotifications.jsx";

import SectionRanking from "./sections/SectionRanking.jsx";
import SectionAchievements from "./sections/SectionAchievements.jsx";

import PlayerProfile from "../SquarePage/sections/PlayerProfile.jsx";

import * as PhotosStore from "./utils/photosStore.js";
import * as TeamsStore from "./utils/teamsStore.js";

import * as ChallengesStore from "./utils/challengesStore.js";
import * as NotificationsStore from "./utils/notificationsStore.js";

import * as XpStore from "./utils/xpStore.js";
import * as AchStore from "./utils/achievementsStore.js";

import SquareHeader from "./components/SquareHeader.jsx";
import SquareTabs from "./components/SquareTabs.jsx";

import SectionOverview from "./sections/SectionOverview.jsx";
import SectionLocal from "./sections/SectionLocal.jsx";
import SectionPresence from "./sections/SectionPresence.jsx";
import SectionChat from "./sections/SectionChat.jsx";

import { buildMapsQuery, buildMapsUrls, safeNow } from "./utils/maps";

export default function SquarePage({ courtId, user, onBack }) {
  const [court, setCourt] = useState(null);
  const [presence, setPresence] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const [photos, setPhotos] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [challenges, setChallenges] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // ✅ Gamificação
  const [leaderboard, setLeaderboard] = useState([]);
  const [myXp, setMyXp] = useState(null);
  const [myAchievements, setMyAchievements] = useState([]);

  const [checkinLoading, setCheckinLoading] = useState(false);
  const [geoHint, setGeoHint] = useState("");
  const [uiHint, setUiHint] = useState("");
  const [sendError, setSendError] = useState("");

  // ✅ Player Profile (tela full)
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // ✅ alvo do desafio
  const [challengeTarget, setChallengeTarget] = useState(null);

  const tabs = useMemo(
    () => [
      { key: "overview", label: "🏟️ Resumo" },
      { key: "local", label: "📍 Local" },
      { key: "presence", label: "👥 Online" },
      { key: "chat", label: "💬 Chat" },
      { key: "photos", label: "📸 Fotos" },
      { key: "teams", label: "🛡️ Times" },
      { key: "challenges", label: "⚔️ Desafios" },
      { key: "ranking", label: "🏆 Ranking" },
      { key: "achievements", label: "🎖️ Conquistas" },
      { key: "notifications", label: "🔔 Notifs" },
    ],
    []
  );

  const [tab, setTab] = useState("overview");

  const iAmHere = useMemo(() => {
    return courtId && user?.id ? isUserPresent(courtId, user.id) : false;
  }, [courtId, user?.id, presence]);

  const maps = useMemo(() => (court ? buildMapsUrls(court) : { embed: "", open: "" }), [court]);
  const mapsMeta = useMemo(() => (court ? buildMapsQuery(court) : { hasCoords: false, label: "" }), [court]);

  const deepLink = useMemo(() => {
    try {
      const origin = window?.location?.origin || "";
      const pathname = window?.location?.pathname || "";
      return `${origin}${pathname}?square=${encodeURIComponent(courtId || "")}`;
    } catch {
      return `?square=${encodeURIComponent(courtId || "")}`;
    }
  }, [courtId]);

  const presenceCount = presence?.length || 0;
  const isLive = presenceCount > 0;

  function refreshGamification(nextUser = user) {
    if (!courtId) return;
    setLeaderboard(XpStore.getLeaderboard(courtId, { limit: 50 }));
    setMyXp(nextUser?.id ? XpStore.getUser(courtId, nextUser) : null);
    setMyAchievements(nextUser?.id ? AchStore.listUnlocked(courtId, nextUser.id) : []);
  }

  useEffect(() => {
    if (!courtId) return;

    const c = getCourtById(courtId);
    setCourt(c);

    setPresence(listPresence(courtId));
    setMessages(listMessages(courtId));

    setPhotos(PhotosStore.listPhotos(courtId));
    setTeams(TeamsStore.listTeams(courtId));

    setChallenges(ChallengesStore.listChallenges(courtId));
    setNotifications(NotificationsStore.listNotifications(courtId));

    setSelectedTeam(null);

    refreshGamification(user);

    const t = setInterval(() => {
      setPresence(listPresence(courtId));
      setMessages(listMessages(courtId));
    }, 1500);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId]);

  useEffect(() => {
    if (!selectedTeam?.id) return;
    const updated = (teams || []).find((t) => t.id === selectedTeam.id) || null;
    setSelectedTeam(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  useEffect(() => {
    refreshGamification(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // =========================
  // Notifications helpers
  // =========================
  function pushNoti(type, title, text, meta = {}) {
    const next = NotificationsStore.pushNotification(courtId, { type, title, text, meta });
    setNotifications(next);
  }

  function handleClearNotifications() {
    const next = NotificationsStore.clearNotifications(courtId);
    setNotifications(next);
  }

  function openNoti(n) {
    const meta = n?.meta || {};
    if (meta.openTab) setTab(meta.openTab);

    if (meta.openTeamId) {
      const t = (teams || []).find((x) => x.id === meta.openTeamId) || null;
      if (t) {
        setTab("teams");
        setSelectedTeam(t);
      }
    }

    if (meta.openChallengeId) {
      setTab("challenges");
    }
  }

  // =========================
  // Gamificação helpers
  // =========================
  function award(actionKey, meta = {}) {
    if (!courtId || !user?.id) return;

    const res = XpStore.awardXp(courtId, user, actionKey, meta);
    setLeaderboard(res.leaderboard || XpStore.getLeaderboard(courtId, { limit: 50 }));
    setMyXp(res.me || XpStore.getUser(courtId, user));

    const { unlocked } = AchStore.checkAndUnlock(courtId, user);

    if (unlocked?.length) {
      unlocked.forEach((a) => {
        XpStore.awardXp(courtId, user, "ACH_UNLOCK", { achievementId: a.id });
        pushNoti("live", "🎖️ Conquista!", `${user?.name || "Você"} desbloqueou: ${a.icon} ${a.title}`, {
          openTab: "achievements",
          achievementId: a.id,
        });
      });

      refreshGamification(user);
    } else {
      setMyAchievements(AchStore.listUnlocked(courtId, user.id));
    }
  }

  // =========================
  // Player Profile helpers
  // =========================
  function openPlayer(raw) {
    if (!raw) return;

    const player = {
      userId: raw.userId || raw.id,
      id: raw.userId || raw.id,
      name: raw.name || "Jogador",
      avatar: raw.avatar || "",
      position: raw.position || "—",
      level: raw.level || 1,
      xp: raw.xp || 0,
    };

    setSelectedPlayer(player);
  }

  function goChallengesWithTarget(player) {
    setChallengeTarget(player || null);
    setSelectedPlayer(null);
    setTab("challenges");

    setUiHint(player?.name ? `Alvo do desafio: ${player.name}` : "");
  }

  // =========================
  // Photos handlers
  // =========================
  function handleAddPhoto({ url, caption }) {
    if (!courtId) return;
    const next = PhotosStore.addPhoto(courtId, user, { url, caption });
    setPhotos(next);
    award("PHOTO_ADD", { url });
  }

  function handleRemovePhoto(photoId) {
    if (!courtId) return;
    const next = PhotosStore.removePhoto(courtId, photoId, user);
    setPhotos(next);
  }

  // =========================
  // Teams handlers
  // =========================
  function handleCreateTeam({ name, sport, badgeUrl }) {
    if (!courtId) return;
    const next = TeamsStore.createTeam(courtId, user, { name, sport, badgeUrl });
    setTeams(next);
    award("TEAM_CREATE", { teamName: name });
  }

  function handleJoinTeam(teamId) {
    if (!courtId) return;
    const next = TeamsStore.joinTeam(courtId, user, teamId);
    setTeams(next);
    award("TEAM_JOIN", { teamId });
  }

  function handleLeaveTeam(teamId) {
    if (!courtId) return;
    const next = TeamsStore.leaveTeam(courtId, user, teamId);
    setTeams(next);
  }

  function handleDeleteTeam(teamId) {
    if (!courtId) return;
    const next = TeamsStore.deleteTeam(courtId, user, teamId);
    setTeams(next);
  }

  // =========================
  // Challenges handlers
  // =========================
  function handleCreateChallenge({ fromTeam, toTeam, whenISO, note }) {
    const next = ChallengesStore.createChallenge(courtId, user, { fromTeam, toTeam, whenISO, note });
    setChallenges(next);

    pushNoti(
      "info",
      "⚔️ Novo desafio!",
      `${fromTeam.name} desafiou ${toTeam.name}${whenISO ? ` • ${whenISO}` : ""}`,
      { openTab: "challenges", openChallengeId: next?.[0]?.id }
    );

    award("CHALLENGE_CREATE", { fromTeamId: fromTeam?.id, toTeamId: toTeam?.id });
  }

  function handleAcceptChallenge(challengeId) {
    const next = ChallengesStore.acceptChallenge(courtId, challengeId);
    setChallenges(next);

    const c = next.find((x) => x.id === challengeId);
    if (c) {
      pushNoti("live", "✅ Desafio aceito!", `${c.toTeam.name} aceitou vs ${c.fromTeam.name}`, {
        openTab: "challenges",
        openChallengeId: challengeId,
      });
    }

    award("CHALLENGE_ACCEPT", { challengeId });
  }

  function handleRejectChallenge(challengeId) {
    const next = ChallengesStore.rejectChallenge(courtId, challengeId);
    setChallenges(next);

    const c = next.find((x) => x.id === challengeId);
    if (c) {
      pushNoti("warn", "❌ Desafio recusado", `${c.toTeam.name} recusou vs ${c.fromTeam.name}`, {
        openTab: "challenges",
        openChallengeId: challengeId,
      });
    }
  }

  function handleCancelChallenge(challengeId) {
    const next = ChallengesStore.cancelChallenge(courtId, challengeId);
    setChallenges(next);

    const c = next.find((x) => x.id === challengeId);
    if (c) {
      pushNoti("warn", "🛑 Desafio cancelado", `${c.fromTeam.name} cancelou o desafio vs ${c.toTeam.name}`, {
        openTab: "challenges",
        openChallengeId: challengeId,
      });
    }
  }

  // =========================
  // Navigation / actions
  // =========================
  function handleBack() {
    if (typeof onBack === "function") return onBack();
    try {
      if (window?.history?.length > 1) window.history.back();
    } catch {
      // noop
    }
  }

  async function handleCheckIn() {
    if (!courtId) return;

    if (!user?.id) {
      setUiHint("Você precisa estar logado para marcar presença.");
      return;
    }

    setCheckinLoading(true);
    setGeoHint("");
    setUiHint("");

    try {
      const next = checkIn(courtId, user, { ttlMinutes: 20 });
      setPresence(next);
      setUiHint("Presença marcada ✅ (dura 20 min e renova quando você marcar de novo).");
      award("CHECKIN");
    } catch {
      setGeoHint("Ative a localização do celular para marcar presença com segurança.");
    } finally {
      setCheckinLoading(false);
    }
  }

  function handleCheckOut() {
    if (!courtId || !user?.id) return;
    const next = checkOut(courtId, user.id);
    setPresence(next);
    setGeoHint("");
    setUiHint("Você saiu da praça. Volte quando quiser ✅");
  }

  function handleSend() {
    setSendError("");
    if (!courtId) return;

    if (!user?.id) {
      setSendError("Você precisa estar logado para mandar mensagem.");
      return;
    }

    const msg = String(text || "").trim();
    if (!msg) {
      setSendError("Digite uma mensagem antes de enviar.");
      return;
    }

    const now = safeNow();
    if (now < cooldownUntil) return;

    setCooldownUntil(now + 2000);

    const next = sendMessage(courtId, user, msg);
    setMessages(next);
    setText("");

    award("CHAT_MSG");
  }

  // =========================
  // Empty state
  // =========================
  if (!court) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.title}>😕 Praça não encontrada</div>
            <div className={styles.hint}>O link pode estar errado ou a praça foi removida do mock.</div>
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleBack}>
                ← Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // ✅ Player Profile FULL SCREEN
  // =========================
  if (selectedPlayer) {
    return (
      <PlayerProfile
        squareId={courtId}
        player={selectedPlayer}
        myUser={user}
        teams={teams}
        onBack={() => setSelectedPlayer(null)}
        onGoChallenges={(p) => goChallengesWithTarget(p)}
      />
    );
  }

  // =========================
  // Main
  // =========================
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SquareHeader
          court={court}
          isLive={isLive}
          presenceCount={presenceCount}
          deepLink={deepLink}
          onBack={handleBack}
          notificationsCount={notifications.length}
          onOpenNotifications={() => setTab("notifications")}
          myXp={myXp}
        />

        <div className={styles.stickyTabs}>
          <SquareTabs
            tab={tab}
            setTab={(nextTab) => {
              setTab(nextTab);
              if (nextTab !== "teams") setSelectedTeam(null);
            }}
            tabs={tabs}
            isLive={isLive}
          />
        </div>

        {uiHint ? (
          <div className={styles.toast} role="status" aria-live="polite">
            <div className={styles.toastText}>{uiHint}</div>
            <button type="button" className={styles.toastClose} onClick={() => setUiHint("")} aria-label="Fechar">
              ✕
            </button>
          </div>
        ) : null}

        <div className={styles.sectionArea}>
          {tab === "overview" ? (
            <SectionOverview
              court={court}
              isLive={isLive}
              presenceCount={presenceCount}
              iAmHere={iAmHere}
              user={user}
              checkinLoading={checkinLoading}
              uiHint={uiHint}
              geoHint={geoHint}
              deepLink={deepLink}
              mapsMetaLabel={mapsMeta.label}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onGoTab={setTab}
            />
          ) : null}

          {tab === "local" ? <SectionLocal court={court} maps={maps} mapsMeta={mapsMeta} deepLink={deepLink} /> : null}

          {tab === "presence" ? (
            <SectionPresence
              presence={presence}
              isLive={isLive}
              presenceCount={presenceCount}
              user={user}
              deepLink={deepLink}
              onCheckIn={handleCheckIn}
              checkinLoading={checkinLoading}
              onOpenPlayer={openPlayer}
            />
          ) : null}

          {tab === "chat" ? (
            <SectionChat
              messages={messages}
              text={text}
              setText={setText}
              user={user}
              cooldownUntil={cooldownUntil}
              sendError={sendError}
              onSend={handleSend}
              onOpenPlayer={openPlayer}
            />
          ) : null}

          {tab === "photos" ? (
            <SectionPhotos photos={photos} user={user} onAdd={handleAddPhoto} onRemove={handleRemovePhoto} />
          ) : null}

          {tab === "teams" ? (
            selectedTeam ? (
              <SectionTeamDetails
                squareId={courtId}
                team={selectedTeam}
                user={user}
                onBackToTeams={() => setSelectedTeam(null)}
                onJoin={(teamId) => handleJoinTeam(teamId)}
                onLeave={(teamId) => handleLeaveTeam(teamId)}
                onDelete={(teamId) => {
                  handleDeleteTeam(teamId);
                  setSelectedTeam(null);
                }}
              />
            ) : (
              <SectionTeams
                teams={teams}
                user={user}
                sports={court?.sports || []}
                onCreate={handleCreateTeam}
                onJoin={handleJoinTeam}
                onLeave={handleLeaveTeam}
                onDelete={handleDeleteTeam}
                onOpenTeam={(team) => {
                  setSelectedTeam(team);
                  setTab("teams");
                }}
              />
            )
          ) : null}

          {tab === "challenges" ? (
            <SectionChallenges
              teams={teams}
              challenges={challenges}
              user={user}
              onCreate={handleCreateChallenge}
              onAccept={handleAcceptChallenge}
              onReject={handleRejectChallenge}
              onCancel={handleCancelChallenge}
              challengeTarget={challengeTarget}
            />
          ) : null}

          {tab === "ranking" ? <SectionRanking squareId={courtId} user={user} onOpenPlayer={openPlayer} /> : null}

          {tab === "achievements" ? (
            <SectionAchievements squareId={courtId} user={user} unlocked={myAchievements} />
          ) : null}

          {tab === "notifications" ? (
            <SectionNotifications items={notifications} onClear={handleClearNotifications} onOpen={openNoti} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
