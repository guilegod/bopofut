import { apiRequest } from "./api.js";

/**
 * Pega a arena do dono logado (se existir).
 * Ajuste o endpoint se o seu backend usar outro.
 */
export async function getMyArena() {
  // opções comuns: "/arenas/me" ou "/arena/me"
  return apiRequest("/arenas/me", { method: "GET" });
}

/**
 * Cria uma nova arena vinculada ao dono logado.
 * Ajuste o endpoint se necessário.
 */
export async function createArena(payload) {
  return apiRequest("/arenas", {
    method: "POST",
    body: payload,
  });
}
