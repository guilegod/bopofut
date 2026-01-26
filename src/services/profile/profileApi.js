// src/services/profileApi.js
import { apiFetch } from "./apiClient.js";

export function getMyProfile() {
  // backend futuro: GET /users/me/profile
  return apiFetch("/users/me/profile");
}

export function getPublicProfile(userId) {
  // backend futuro: GET /users/:id/profile
  return apiFetch(`/users/${userId}/profile`);
}

export function updateMyProfile(payload) {
  // backend futuro: PATCH /users/me/profile
  return apiFetch("/users/me/profile", { method: "PATCH", body: payload });
}
