import { apiRequest } from "./api.js";

export function listMatches() {
  return apiRequest("/matches");
}

export function createMatch(token, payload) {
  return apiRequest("/matches", {
    method: "POST",
    token,
    body: payload,
  });
}
