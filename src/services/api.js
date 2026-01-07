const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export async function apiRequest(path, { token, method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = (data && data.message) ? data.message : "Erro na API";
    throw new Error(msg);
  }

  return data;
}
