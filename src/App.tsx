import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, createStore } from "jotai";
import { syncWithLocalTheme } from "./actions/theme";
import { useTranslation } from "react-i18next";
import { updateAppLanguage } from "./actions/language";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./utils/routes";
import "./localization/i18n";

// Create a store explicitly to ensure state is shared
const jotaiStore = createStore();

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    syncWithLocalTheme();
    updateAppLanguage(i18n);
  }, [i18n]);

  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <Provider store={jotaiStore}>
      <App />
    </Provider>
  </React.StrictMode>,
);
