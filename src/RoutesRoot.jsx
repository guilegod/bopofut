import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing/Landing.jsx";
import Maintenance from "./pages/Maintenance/Maintenance.jsx";

import OwnerRegister from "./pages/OwnerRegister/OwnerRegister.jsx";
import OwnerCreateArena from "./pages/OwnerCreateArena/OwnerCreateArena.jsx";

import RequireAdmin from "./pages/Admin/RequireAdmin.jsx";
import AdminPanel from "./pages/Admin/AdminPanel.jsx";

// ✅ App antigo continua “como está”, só que dentro de /app
import App from "./App.jsx";

export default function RoutesRoot() {
  const MAINTENANCE = false;

  if (MAINTENANCE) return <Maintenance />;

  return (
    <Routes>
      {/* Landing */}
      <Route
        path="/"
        element={
          <Landing
            onEnterApp={() => window.location.assign("/app")}
            onEnterPanel={() => window.location.assign("/painel")}
          />
        }
      />

      {/* ✅ Seu app antigo inteiro aqui */}
      <Route path="/app/*" element={<App />} />

      {/* ✅ Rotas novas do Dono */}
      <Route path="/painel" element={<Navigate to="/painel/cadastro" replace />} />
      <Route path="/painel/cadastro" element={<OwnerRegister />} />
      <Route path="/painel/criar-arena" element={<OwnerCreateArena />} />

      {/* ✅ Rotas novas do Admin (protegidas) */}
      <Route element={<RequireAdmin />}>
        {/* Admin base (deixa com * pra você crescer depois) */}
        <Route path="/painel/admin/*" element={<AdminPanel />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
