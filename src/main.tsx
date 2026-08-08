import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import Message from "./pages/obs/Message";
import App from "./App";
import Admin from "./pages/admin/Admin";

import "./index.css";

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
      </Routes>
    </BrowserRouter>
  </StrictMode>
);