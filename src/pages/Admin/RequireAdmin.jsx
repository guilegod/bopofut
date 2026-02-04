import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getToken, me } from "../../services/authService.js";

function isAdminRole(user) {
  const role = String(user?.role || user?.user?.role || "").toLowerCase();
  return role === "admin";
}

export default function RequireAdmin() {
  const loc = useLocation();
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const token = getToken();
        if (!token) {
          if (!alive) return;
          setState({ loading: false, ok: false });
          return;
        }

        const user = await me(token);

        if (!alive) return;
        setState({ loading: false, ok: isAdminRole(user) });
      } catch {
        if (!alive) return;
        setState({ loading: false, ok: false });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
        <div style={{ opacity: 0.85, fontWeight: 900 }}>Carregando Admin…</div>
      </div>
    );
  }

  if (!state.ok) {
    // se não for admin, manda pro login ou home (ajusta se quiser)
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
}
