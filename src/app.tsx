import { RouterProvider } from "@tanstack/react-router";
import { createStore, Provider } from "jotai";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import { updateAppLanguage } from "./actions/language";
import { ThemeProvider } from "./components/theme-provider";
import { router } from "./utils/routes";
import "./localization/i18n";

// Create a store explicitly to ensure state is shared
const jotaiStore = createStore();

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

const appElement = document.getElementById("app");
if (!appElement) {
  throw new Error("Failed to find the app element");
}
const root = createRoot(appElement);
root.render(
  <React.StrictMode>
    <Provider store={jotaiStore}>
      <App />
    </Provider>
  </React.StrictMode>
);
