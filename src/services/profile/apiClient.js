// src/services/apiClient.js
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getStoredToken() {
  // Ajuste aqui se você usa outro nome (ex: "accessToken")
  return localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
}

export async function apiFetch(path, options = {}) {
  const baseUrl =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") || ""; // ex: https://seu-backend.onrender.com

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const token = options.token ?? getStoredToken();

  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Erro na API (${res.status}) ao acessar ${path}`;
    throw new ApiError(msg, res.status, data);
  }

  return data;
}
