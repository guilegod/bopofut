import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import RoutesRoot from "./RoutesRoot.jsx";

import "./styles/theme.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <RoutesRoot />
    </BrowserRouter>
  </StrictMode>
);
