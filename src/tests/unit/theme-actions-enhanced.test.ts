/**
 * Pragmatic tests for theme actions
 * Tests actual DOM manipulation and localStorage behavior with proper async handling
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentTheme,
  setTheme,
  syncWithLocalTheme,
  toggleTheme,
} from "@/actions/theme";
import { ipc } from "@/ipc/manager";
import type { ThemeMode } from "@/types/theme-mode";

// Mock IPC manager
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

describe("Theme Actions (DOM Integration)", () => {
  let storageMock: Record<string, string>;
  const THEME_KEY = "theme"; // LOCAL_STORAGE_KEYS.THEME

  beforeEach(() => {
    // Mock localStorage
    storageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storageMock[key] || null,
      setItem: (key: string, value: string) => {
        storageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete storageMock[key];
      },
    });

    // Reset document class
    document.documentElement.className = "";

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.className = "";
  });

  describe("setTheme", () => {
    it("should add dark class and save to localStorage", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      await setTheme("dark");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(storageMock[THEME_KEY]).toBe("dark");
      expect(ipc.client.theme.setThemeMode).toHaveBeenCalledWith("dark");
    });

    it("should remove dark class for light theme", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);
      document.documentElement.classList.add("dark");

      await setTheme("light");

      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(storageMock[THEME_KEY]).toBe("light");
      expect(ipc.client.theme.setThemeMode).toHaveBeenCalledWith("light");
    });

    it("should remove dark class for system theme", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      document.documentElement.classList.add("dark");
      await setTheme("system");

      // System theme treats "system" as not "dark", so removes the class
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(storageMock[THEME_KEY]).toBe("system");
      expect(ipc.client.theme.setThemeMode).toHaveBeenCalledWith("system");
    });
  });

  describe("toggleTheme", () => {
    it("should toggle from light to dark", async () => {
      storageMock[THEME_KEY] = "light";
      vi.mocked(ipc.client.theme.toggleThemeMode).mockResolvedValue(true);

      await toggleTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(storageMock[THEME_KEY]).toBe("dark");
    });

    it("should toggle from dark to light", async () => {
      storageMock[THEME_KEY] = "dark";
      vi.mocked(ipc.client.theme.toggleThemeMode).mockResolvedValue(false);
      document.documentElement.classList.add("dark");

      await toggleTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(storageMock[THEME_KEY]).toBe("light");
    });

    it("should toggle to dark when starting from system", async () => {
      storageMock[THEME_KEY] = "system";
      vi.mocked(ipc.client.theme.toggleThemeMode).mockResolvedValue(true);

      await toggleTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(storageMock[THEME_KEY]).toBe("dark");
    });
  });

  describe("getCurrentTheme", () => {
    it("should return local theme when set", async () => {
      storageMock[THEME_KEY] = "dark";
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue(
        "light"
      );

      const result = await getCurrentTheme();

      expect(result.local).toBe("dark");
      expect(result.system).toBe("light");
    });

    it("should return null local theme when not set", async () => {
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue("dark");

      const result = await getCurrentTheme();

      expect(result.local).toBeNull();
      expect(result.system).toBe("dark");
    });

    it("should return system preference for dark mode", async () => {
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue("dark");

      const result = await getCurrentTheme();

      expect(result.system).toBe("dark");
    });

    it("should return system preference for light mode", async () => {
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue(
        "light"
      );

      const result = await getCurrentTheme();

      expect(result.system).toBe("light");
    });
  });

  describe("syncWithLocalTheme", () => {
    it("should set system theme when no local preference exists", async () => {
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue("dark");
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      await syncWithLocalTheme();

      // syncWithLocalTheme calls setTheme("system") when no local pref
      expect(ipc.client.theme.setThemeMode).toHaveBeenCalledWith("system");
      // setTheme("system") removes dark class since "system" !== "dark"
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should use local preference when available", async () => {
      storageMock[THEME_KEY] = "light";
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue("dark");
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      await syncWithLocalTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(ipc.client.theme.setThemeMode).toHaveBeenCalledWith("light");
    });

    it("should sync to dark mode when local preference is dark", async () => {
      storageMock[THEME_KEY] = "dark";
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      await syncWithLocalTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(ipc.client.theme.setThemeMode).toHaveBeenCalledWith("dark");
    });
  });

  describe("Edge cases", () => {
    it("should handle invalid localStorage values gracefully", async () => {
      storageMock[THEME_KEY] = "invalid" as ThemeMode;
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue(
        "light"
      );
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      await syncWithLocalTheme();

      // syncWithLocalTheme calls setTheme("system") when local is not light/dark/system
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should handle empty localStorage", async () => {
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue("dark");

      const result = await getCurrentTheme();

      expect(result.local).toBeNull();
    });

    it("should handle rapid theme changes", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      await setTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      await setTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      await setTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("Theme persistence", () => {
    it("should persist theme changes across operations", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);
      vi.mocked(ipc.client.theme.getCurrentThemeMode).mockResolvedValue("dark");

      await setTheme("dark");
      expect(storageMock[THEME_KEY]).toBe("dark");

      const current = await getCurrentTheme();
      expect(current.local).toBe("dark");
    });

    it("should handle theme transitions correctly", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);
      vi.mocked(ipc.client.theme.toggleThemeMode)
        .mockResolvedValueOnce(true) // First toggle to dark
        .mockResolvedValueOnce(false); // Second toggle to light

      await setTheme("light");
      expect(storageMock[THEME_KEY]).toBe("light");

      await toggleTheme();
      expect(storageMock[THEME_KEY]).toBe("dark");

      await toggleTheme();
      expect(storageMock[THEME_KEY]).toBe("light");
    });
  });

  describe("DOM manipulation", () => {
    it("should add dark class when isDarkMode is true", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      await setTheme("dark");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should remove dark class when isDarkMode is false", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);
      document.documentElement.classList.add("dark");

      await setTheme("light");

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should override system preference with local theme", async () => {
      vi.mocked(ipc.client.theme.setThemeMode).mockResolvedValue(undefined);

      await setTheme("light");

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });
});
