import { readJSON, writeJSON, uid } from "./storage";

function keyForSquare(squareId) {
  return `publicSquares.photos.${squareId}`;
}

export function listPhotos(squareId) {
  if (!squareId) return [];
  return readJSON(keyForSquare(squareId), []);
}

export function addPhoto(squareId, user, { url, caption }) {
  if (!squareId) return listPhotos(squareId);

  const next = [
    {
      id: uid("photo"),
      url: String(url || "").trim(),
      caption: String(caption || "").trim(),
      by: { id: user?.id || "anon", name: user?.name || "Anônimo" },
      at: Date.now(),
    },
    ...listPhotos(squareId),
  ];

  writeJSON(keyForSquare(squareId), next);
  return next;
}

export function removePhoto(squareId, photoId, user) {
  const all = listPhotos(squareId);
  const target = all.find((p) => p.id === photoId);

  // só autor remove (por enquanto)
  const canRemove = user?.id && target?.by?.id === user.id;
  if (!canRemove) return all;

  const next = all.filter((p) => p.id !== photoId);
  writeJSON(keyForSquare(squareId), next);
  return next;
}
