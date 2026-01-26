import { readJSON, writeJSON, uid } from "./storage";

function keyForSquare(squareId) {
  return `publicSquares.teams.${squareId}`;
}

export function listTeams(squareId) {
  if (!squareId) return [];
  return readJSON(keyForSquare(squareId), []);
}

export function createTeam(squareId, user, { name, sport, badgeUrl }) {
  if (!squareId) return listTeams(squareId);

  const trimmed = String(name || "").trim();
  if (!trimmed) return listTeams(squareId);

  const me = { id: user?.id || "anon", name: user?.name || "Anônimo" };

  const team = {
    id: uid("team"),
    name: trimmed,
    sport: String(sport || "").trim(),
    badgeUrl: String(badgeUrl || "").trim(),
    captain: me,
    members: [me],
    createdAt: Date.now(),
  };

  const next = [team, ...listTeams(squareId)];
  writeJSON(keyForSquare(squareId), next);
  return next;
}

export function joinTeam(squareId, user, teamId) {
  const all = listTeams(squareId);
  const me = { id: user?.id || "anon", name: user?.name || "Anônimo" };

  const next = all.map((t) => {
    if (t.id !== teamId) return t;

    const has = (t.members || []).some((m) => m.id === me.id);
    if (has) return t;

    return { ...t, members: [...(t.members || []), me] };
  });

  writeJSON(keyForSquare(squareId), next);
  return next;
}

export function leaveTeam(squareId, user, teamId) {
  const all = listTeams(squareId);
  const meId = user?.id || "anon";

  const next = all
    .map((t) => {
      if (t.id !== teamId) return t;

      // capitão não sai (por enquanto)
      if (t.captain?.id === meId) return t;

      return { ...t, members: (t.members || []).filter((m) => m.id !== meId) };
    })
    // remove time vazio (se não tiver membros)
    .filter((t) => (t.members || []).length > 0);

  writeJSON(keyForSquare(squareId), next);
  return next;
}

export function deleteTeam(squareId, user, teamId) {
  const all = listTeams(squareId);
  const meId = user?.id || "anon";

  const target = all.find((t) => t.id === teamId);
  const canDelete = target?.captain?.id === meId;
  if (!canDelete) return all;

  const next = all.filter((t) => t.id !== teamId);
  writeJSON(keyForSquare(squareId), next);
  return next;
}
