import { readJSON, writeJSON, uid } from "./storage";

function keyForTeam(squareId, teamId) {
  return `publicSquares.teamChat.${squareId}.${teamId}`;
}

export function listTeamMessages(squareId, teamId) {
  if (!squareId || !teamId) return [];
  return readJSON(keyForTeam(squareId, teamId), []);
}

export function sendTeamMessage(squareId, teamId, user, text) {
  if (!squareId || !teamId) return listTeamMessages(squareId, teamId);

  const msg = String(text || "").trim();
  if (!msg) return listTeamMessages(squareId, teamId);

  const next = [
    ...listTeamMessages(squareId, teamId),
    {
      id: uid("tmsg"),
      text: msg,
      at: Date.now(),
      userId: user?.id || "anon",
      name: user?.name || "Anônimo",
    },
  ];

  writeJSON(keyForTeam(squareId, teamId), next);
  return next;
}
