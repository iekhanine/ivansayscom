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
import Live from "./pages/obs/Live";
import YouTubeLive from "./pages/obs/YouTubeLive";

import "./index.css";


// ==========================================================
// APPLICATION 001 - ROOT
// ==========================================================

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

        <Route
          path="/obs/message"
          element={<Message />}
        />

        <Route
          path="/obs/text"
          element={<Text />}
        />

        <Route
          path="/obs/live"
          element={<Live />}
        />

        <Route
          path="/obs/youtube"
          element={<YouTubeLive />}
        />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);
