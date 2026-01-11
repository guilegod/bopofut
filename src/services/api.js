// api.js
const API_BASE =
  import.meta?.env?.VITE_API_URL ||
  "https://api-bolafut.onrender.com";

// ✅ lista de chaves possíveis onde seu app pode estar salvando token
const TOKEN_KEYS = [
  "bolafut_token",
  "token",
  "auth_token",
  "access_token",
  "jwt",
  "bopofut_token",
];

export function getToken() {
  try {
    for (const k of TOKEN_KEYS) {
      const v = localStorage.getItem(k);
      if (v && typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  } catch {
    return "";
  }
}

export function setToken(token, key = "bolafut_token") {
  try {
    if (!token) {
      TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
      return;
    }
    localStorage.setItem(key, token);
  } catch {
    // ignore
  }
}

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  // ✅ token manual tem prioridade (options.token)
  const manualToken = (options.token || "").toString().trim();
  const storedToken = getToken();

  const tokenToUse = manualToken || storedToken;

  if (tokenToUse && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${tokenToUse}`;
  }

  let body = options.body;
  const hasBody = body !== undefined && body !== null;

  if (hasBody && !(body instanceof FormData)) {
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (typeof body === "object") {
      body = JSON.stringify(body);
    }
  }

  // ✅ Debug melhorado: mostra se Authorization foi anexado (sem vazar token inteiro)
  try {
    const safeHeaders = { ...headers };
    if (safeHeaders.Authorization) {
      safeHeaders.Authorization = safeHeaders.Authorization.slice(0, 18) + "...";
    }
    console.log("[apiRequest]", method, url, {
      headers: safeHeaders,
      body: hasBody ? (typeof body === "string" ? body : "[binary/formdata]") : undefined,
      tokenFound: Boolean(tokenToUse),
      tokenSource: manualToken ? "manual" : storedToken ? "localStorage" : "none",
    });
  } catch {
    // ignore
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    body,
  });

  const contentType = res.headers.get("content-type") || "";
  let data = null;
  let rawText = "";

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      rawText = await res.text();
    } catch {
      rawText = "";
    }
  }

  if (!res.ok) {
    console.error("[apiRequest:error]", method, url, {
      status: res.status,
      responseJson: data,
      responseText: rawText,
    });

    const message =
      (data && (data.message || data.error)) ||
      rawText ||
      `Erro HTTP ${res.status}`;

    const err = new Error(message);
    err.status = res.status;
    err.details = data || rawText;
    throw err;
  }

  if (!contentType.includes("application/json")) return rawText;
  return data;
}

export const api = {
  get: (path, opts = {}) => apiRequest(path, { method: "GET", ...opts }),
  post: (path, body, opts = {}) => apiRequest(path, { method: "POST", body, ...opts }),
  put: (path, body, opts = {}) => apiRequest(path, { method: "PUT", body, ...opts }),
  del: (path, opts = {}) => apiRequest(path, { method: "DELETE", ...opts }),
};
