import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ensureI18nReady } from "./i18n/config";

ensureI18nReady().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
