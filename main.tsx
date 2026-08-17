import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App";
import Admin from "./pages/admin/Admin";
import Message from "./pages/obs/Message";
import Text from "./pages/obs/Text";
import LiveOverlay from "./pages/obs/LiveOverlay";

import "./index.css";


// ==========================================================
// APPLICATION 001 — ROOT
// ==========================================================

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        {/* ==================================================
            HOME 002
            ================================================== */}

        <Route
          path="/"
          element={<App />}
        />


        {/* ==================================================
            ADMIN 003
            ================================================== */}

        <Route
          path="/admin"
          element={<Admin />}
        />


        {/* ==================================================
            OBS MESSAGE 004 — LEGACY MESSAGE OVERLAY
            ================================================== */}

        <Route
          path="/obs/message"
          element={<Message />}
        />


        {/* ==================================================
            OBS TEXT 005 — LEGACY TEXT ONLY
            ================================================== */}

        <Route
          path="/obs/text"
          element={<Text />}
        />


        {/* ==================================================
            OBS LIVE 006 — COMPLETE TIKTOK OVERLAY
            ================================================== */}

        <Route
          path="/obs/live"
          element={<LiveOverlay />}
        />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);
