// Developed By: Vishnukarthick K

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";
import { initTheme } from "./lib/theme";

initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary fallbackClassName="flex min-h-screen items-center justify-center p-6">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Production only — a registered service worker in dev would fight Vite's own HMR/module
// caching. See public/sw.js for what it actually caches.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
