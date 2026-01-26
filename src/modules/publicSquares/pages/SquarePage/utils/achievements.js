// Achievements — Praça (MVP)
// Lista e condições das conquistas.
import { getStats, getRankOfUser } from "./xpStore.js";

export const ACHIEVEMENTS = [
  {
    id: "first_checkin",
    icon: "✅",
    title: "Primeira presença",
    desc: "Marcou presença pela primeira vez na praça.",
    check: ({ squareId, userId }) => (getStats(squareId, userId).CHECKIN || 0) >= 1,
  },
  {
    id: "regular_10",
    icon: "🔥",
    title: "Frequente",
    desc: "Fez 10 check-ins na praça.",
    check: ({ squareId, userId }) => (getStats(squareId, userId).CHECKIN || 0) >= 10,
  },
  {
    id: "chatter_25",
    icon: "💬",
    title: "Resenha",
    desc: "Mandou 25 mensagens no chat (acumulado).",
    check: ({ squareId, userId }) => (getStats(squareId, userId).CHAT_MSG || 0) >= 25,
  },
  {
    id: "first_photo",
    icon: "📸",
    title: "Fotógrafo da praça",
    desc: "Enviou a primeira foto.",
    check: ({ squareId, userId }) => (getStats(squareId, userId).PHOTO_ADD || 0) >= 1,
  },
  {
    id: "captain",
    icon: "🛡️",
    title: "Capitão",
    desc: "Criou um time na praça.",
    check: ({ squareId, userId }) => (getStats(squareId, userId).TEAM_CREATE || 0) >= 1,
  },
  {
    id: "first_challenge",
    icon: "⚔️",
    title: "Desafiador",
    desc: "Criou o primeiro desafio (time vs time).",
    check: ({ squareId, userId }) => (getStats(squareId, userId).CHALLENGE_CREATE || 0) >= 1,
  },
  {
    id: "accepted_3",
    icon: "🤝",
    title: "Sem medo",
    desc: "Aceitou 3 desafios.",
    check: ({ squareId, userId }) => (getStats(squareId, userId).CHALLENGE_ACCEPT || 0) >= 3,
  },
  {
    id: "top10",
    icon: "🏆",
    title: "Top 10",
    desc: "Entrou no Top 10 do ranking da praça.",
    check: ({ squareId, userId }) => {
      const rank = getRankOfUser(squareId, userId);
      return rank != null && rank <= 10;
    },
  },
];
