import { readJSON, writeJSON, uid } from "./storage";

function keyForSquare(squareId) {
  return `publicSquares.notifications.${squareId}`;
}

export function listNotifications(squareId) {
  if (!squareId) return [];
  return readJSON(keyForSquare(squareId), []);
}

export function pushNotification(squareId, payload) {
  if (!squareId) return [];

  const item = {
    id: uid("noti"),
    at: Date.now(),
    type: payload?.type || "info", // info | success | warn
    title: String(payload?.title || "Atualização"),
    text: String(payload?.text || ""),
    meta: payload?.meta || {},
  };

  const next = [item, ...listNotifications(squareId)].slice(0, 50);
  writeJSON(keyForSquare(squareId), next);
  return next;
}

export function clearNotifications(squareId) {
  writeJSON(keyForSquare(squareId), []);
  return [];
}
