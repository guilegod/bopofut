// src/services/presenceApi.js
import { apiFetch } from "./apiClient.js";

export function getFriendsPresence() {
  // GET /presence/friends
  return apiFetch("/presence/friends");
}

export function heartbeat() {
  // POST /presence/heartbeat
  return apiFetch("/presence/heartbeat", { method: "POST" });
}
