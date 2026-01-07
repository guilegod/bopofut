import { apiRequest } from "./api.js";

const TOKEN_KEY = "bopo_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function register({ name, email, password, role }) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: { name, email, password, role },
  });
}

export async function login({ email, password }) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function me(token) {
  return apiRequest("/auth/me", {
    method: "GET",
    token,
  });
}
