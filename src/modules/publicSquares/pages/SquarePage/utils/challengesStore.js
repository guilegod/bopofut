import { readJSON, writeJSON, uid } from "./storage";

function keyForSquare(squareId) {
  return `publicSquares.challenges.${squareId}`;
}

export function listChallenges(squareId) {
  if (!squareId) return [];
  return readJSON(keyForSquare(squareId), []);
}

export function createChallenge(squareId, user, { fromTeam, toTeam, whenISO, note }) {
  if (!squareId) return listChallenges(squareId);

  const item = {
    id: uid("chal"),
    status: "PENDING", // PENDING | ACCEPTED | REJECTED | CANCELED
    createdAt: Date.now(),
    updatedAt: Date.now(),

    fromTeam: { id: fromTeam.id, name: fromTeam.name },
    toTeam: { id: toTeam.id, name: toTeam.name },

    whenISO: String(whenISO || "").trim(),
    note: String(note || "").trim(),

    createdBy: { id: user?.id || "anon", name: user?.name || "Anônimo" },
  };

  const next = [item, ...listChallenges(squareId)];
  writeJSON(keyForSquare(squareId), next);
  return next;
}

export function updateStatus(squareId, challengeId, status) {
  const all = listChallenges(squareId);

  const next = all.map((c) => {
    if (c.id !== challengeId) return c;
    return { ...c, status, updatedAt: Date.now() };
  });

  writeJSON(keyForSquare(squareId), next);
  return next;
}

export const acceptChallenge = (squareId, id) => updateStatus(squareId, id, "ACCEPTED");
export const rejectChallenge = (squareId, id) => updateStatus(squareId, id, "REJECTED");
export const cancelChallenge = (squareId, id) => updateStatus(squareId, id, "CANCELED");
