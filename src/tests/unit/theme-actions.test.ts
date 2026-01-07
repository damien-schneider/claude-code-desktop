import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock IPC before imports
vi.mock("@/ipc/manager", () => ({
  ipc: {
    client: {
      theme: {
        getCurrentThemeMode: vi.fn(),
        setThemeMode: vi.fn(),
        toggleThemeMode: vi.fn(),
      },
    },
  },
}));

import * as themeActions from "@/actions/theme";
import { LOCAL_STORAGE_KEYS } from "@/constants";
import { ipc } from "@/ipc/manager";

// Type-safe mock access
const mockIpc = ipc as any;

describe("Theme Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset document class list
    document.documentElement.classList.remove("dark");
  });

  describe("getCurrentTheme", () => {
    it("should return theme preferences from system and localStorage", async () => {
      mockIpc.client.theme.getCurrentThemeMode.mockResolvedValue("dark");
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, "light");

      const result = await themeActions.getCurrentTheme();

      expect(result).toEqual({
        system: "dark",
        local: "light",
      });
      expect(mockIpc.client.theme.getCurrentThemeMode).toHaveBeenCalledOnce();
    });

    it("should return null for local theme when not set in localStorage", async () => {
      mockIpc.client.theme.getCurrentThemeMode.mockResolvedValue("light");

      const result = await themeActions.getCurrentTheme();

      expect(result).toEqual({
        system: "light",
        local: null,
      });
    });

    it("should handle system theme mode", async () => {
      mockIpc.client.theme.getCurrentThemeMode.mockResolvedValue("system");
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, "dark");

      const result = await themeActions.getCurrentTheme();

      expect(result).toEqual({
        system: "system",
        local: "dark",
      });
    });
  });

  describe("setTheme", () => {
    it("should set dark theme and update document", async () => {
      mockIpc.client.theme.setThemeMode.mockResolvedValue(undefined);

      await themeActions.setTheme("dark");

      expect(mockIpc.client.theme.setThemeMode).toHaveBeenCalledWith("dark");
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should set light theme and remove dark class from document", async () => {
      mockIpc.client.theme.setThemeMode.mockResolvedValue(undefined);
      document.documentElement.classList.add("dark"); // Start with dark mode

      await themeActions.setTheme("light");

      expect(mockIpc.client.theme.setThemeMode).toHaveBeenCalledWith("light");
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should set system theme", async () => {
      mockIpc.client.theme.setThemeMode.mockResolvedValue(undefined);

      await themeActions.setTheme("system");

      expect(mockIpc.client.theme.setThemeMode).toHaveBeenCalledWith("system");
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)).toBe("system");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("toggleTheme", () => {
    it("should toggle to dark mode and update document", async () => {
      mockIpc.client.theme.toggleThemeMode.mockResolvedValue(true);

      await themeActions.toggleTheme();

      expect(mockIpc.client.theme.toggleThemeMode).toHaveBeenCalledOnce();
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should toggle to light mode and remove dark class from document", async () => {
      mockIpc.client.theme.toggleThemeMode.mockResolvedValue(false);
      document.documentElement.classList.add("dark"); // Start with dark mode

      await themeActions.toggleTheme();

      expect(mockIpc.client.theme.toggleThemeMode).toHaveBeenCalledOnce();
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("syncWithLocalTheme", () => {
    it("should set system theme when no local theme is stored", async () => {
      mockIpc.client.theme.getCurrentThemeMode.mockResolvedValue("dark");
      mockIpc.client.theme.setThemeMode.mockResolvedValue(undefined);

      await themeActions.syncWithLocalTheme();

      expect(mockIpc.client.theme.setThemeMode).toHaveBeenCalledWith("system");
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)).toBe("system");
    });

    it("should set theme to local preference when available", async () => {
      mockIpc.client.theme.getCurrentThemeMode.mockResolvedValue("light");
      mockIpc.client.theme.setThemeMode.mockResolvedValue(undefined);
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, "dark");

      await themeActions.syncWithLocalTheme();

      expect(mockIpc.client.theme.setThemeMode).toHaveBeenCalledWith("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should sync to light mode when local preference is light", async () => {
      mockIpc.client.theme.getCurrentThemeMode.mockResolvedValue("dark");
      mockIpc.client.theme.setThemeMode.mockResolvedValue(undefined);
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, "light");
      document.documentElement.classList.add("dark"); // Start with dark mode

      await themeActions.syncWithLocalTheme();

      expect(mockIpc.client.theme.setThemeMode).toHaveBeenCalledWith("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });
});
