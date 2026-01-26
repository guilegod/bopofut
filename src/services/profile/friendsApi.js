// src/services/friendsApi.js
import { apiFetch } from "./apiClient.js";

export function listFriends() {
  // GET /friends
  return apiFetch("/friends");
}

export function listIncomingRequests() {
  // GET /friends/requests/incoming
  return apiFetch("/friends/requests/incoming");
}

export function listOutgoingRequests() {
  // GET /friends/requests/outgoing
  return apiFetch("/friends/requests/outgoing");
}

export function sendFriendRequest(toUserId) {
  // POST /friends/request
  return apiFetch("/friends/request", { method: "POST", body: { toUserId } });
}

export function acceptFriendRequest(friendshipId) {
  // POST /friends/:id/accept
  return apiFetch(`/friends/${friendshipId}/accept`, { method: "POST" });
}

export function declineFriendRequest(friendshipId) {
  // POST /friends/:id/decline
  return apiFetch(`/friends/${friendshipId}/decline`, { method: "POST" });
}

export function cancelOutgoingRequest(friendshipId) {
  // POST /friends/:id/cancel
  return apiFetch(`/friends/${friendshipId}/cancel`, { method: "POST" });
}

export function removeFriend(friendshipId) {
  // DELETE /friends/:id
  return apiFetch(`/friends/${friendshipId}`, { method: "DELETE" });
}

export function blockUser(friendshipId) {
  // POST /friends/:id/block
  return apiFetch(`/friends/${friendshipId}/block`, { method: "POST" });
}
