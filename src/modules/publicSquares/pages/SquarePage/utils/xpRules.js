// XP Rules — Praça (MVP)
// Centraliza quanto cada ação vale (e limites).
export const XP_RULES = {
  CHECKIN: { xp: 10, label: "Check-in" },
  CHAT_MSG: { xp: 1, label: "Mensagem no chat", dailyCap: 30 }, // anti-spam
  PHOTO_ADD: { xp: 5, label: "Foto enviada" },
  TEAM_CREATE: { xp: 25, label: "Time criado" },
  TEAM_JOIN: { xp: 10, label: "Entrou em time" },
  CHALLENGE_CREATE: { xp: 15, label: "Desafio criado" },
  CHALLENGE_ACCEPT: { xp: 10, label: "Desafio aceito" },
  ACH_UNLOCK: { xp: 20, label: "Conquista desbloqueada" }, // bônus
};

export function getRule(actionKey) {
  return XP_RULES[actionKey] || { xp: 0, label: "Ação" };
}
