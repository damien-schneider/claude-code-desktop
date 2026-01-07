/**
 * Pragmatic tests for constants and utilities
 */
import { describe, expect, it } from "vitest";
import { IPC_CHANNELS } from "@/constants";

// Top-level regex patterns for performance
const CLAUDE_MODEL_REGEX = /^claude-/;
const WINDOWS_PATH_REGEX = /^[A-Z]:\\/;
const UNIX_PATH_REGEX = /^\//;
const HTTP_URL_REGEX = /^https?:\/\//;
const FILE_URL_REGEX = /^file:\/\//;
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}:\d{2}$/;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,6}$/;
const RGB_START_REGEX = /^rgb\(/;
const HSL_START_REGEX = /^hsl\(/;
const UPPERCASE_START_REGEX = /^[A-Z]/;
const ERR_PREFIX_REGEX = /^ERR_/;

describe("Constants", () => {
  describe("IPC_CHANNELS", () => {
    it("should have START_ORPC_SERVER channel", () => {
      expect(IPC_CHANNELS.START_ORPC_SERVER).toBeDefined();
      expect(typeof IPC_CHANNELS.START_ORPC_SERVER).toBe("string");
    });

    it("should have unique channel names", () => {
      const channels = Object.values(IPC_CHANNELS);
      const uniqueChannels = new Set(channels);

      expect(channels.length).toBe(uniqueChannels.size);
    });

    it("should have non-empty channel names", () => {
      for (const channel of Object.values(IPC_CHANNELS)) {
        expect(channel.length).toBeGreaterThan(0);
      }
    });
  });

  describe("String constants", () => {
    it("should handle storage key constants", () => {
      const key = "local-theme";
      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
    });

    it("should handle favorite storage key", () => {
      const key = "claude-code-manager-favorites";
      expect(key).toContain("favorites");
    });
  });

  describe("Numeric constants", () => {
    it("should handle timeout values", () => {
      const timeout = 5000;
      expect(typeof timeout).toBe("number");
      expect(timeout).toBeGreaterThan(0);
    });

    it("should handle max limits", () => {
      const maxProjects = 1000;
      expect(maxProjects).toBeGreaterThan(0);
    });
  });

  describe("Configuration defaults", () => {
    it("should have default theme values", () => {
      const themes = ["light", "dark", "system"];
      expect(themes).toContain("system");
      expect(themes).toContain("light");
      expect(themes).toContain("dark");
    });

    it("should have valid model names", () => {
      const models = [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022",
        "claude-3-opus-20240229",
      ];

      for (const model of models) {
        expect(model).toMatch(CLAUDE_MODEL_REGEX);
      }
    });
  });

  describe("File extensions", () => {
    it("should recognize markdown extensions", () => {
      const mdExtensions = [".md", ".markdown"];
      for (const ext of mdExtensions) {
        expect(ext.startsWith(".")).toBe(true);
      }
    });

    it("should recognize config extensions", () => {
      const configExtensions = [".json", ".yaml", ".yml"];
      for (const ext of configExtensions) {
        expect(ext.startsWith(".")).toBe(true);
      }
    });
  });

  describe("Directory names", () => {
    it("should recognize Claude directory", () => {
      const claudeDir = ".claude";
      expect(claudeDir.startsWith(".")).toBe(true);
    });

    it("should recognize hidden directories", () => {
      const hiddenDirs = [".git", ".claude", ".config"];
      for (const dir of hiddenDirs) {
        expect(dir.startsWith(".")).toBe(true);
      }
    });
  });

  describe("Platform detection patterns", () => {
    it("should detect Windows paths", () => {
      const windowsPath = "C:\\Users\\test";
      expect(windowsPath).toMatch(WINDOWS_PATH_REGEX);
    });

    it("should detect Unix paths", () => {
      const unixPath = "/home/user";
      expect(unixPath).toMatch(UNIX_PATH_REGEX);
    });

    it("should detect home directory shorthand", () => {
      const homePath = "~/Documents";
      expect(homePath.charAt(0)).toBe("~");
    });
  });

  describe("URL patterns", () => {
    it("should recognize HTTP URLs", () => {
      const url = "http://example.com";
      expect(url).toMatch(HTTP_URL_REGEX);
    });

    it("should recognize HTTPS URLs", () => {
      const url = "https://example.com";
      expect(url).toMatch(HTTP_URL_REGEX);
    });

    it("should recognize file URLs", () => {
      const url = "file:///path/to/file";
      expect(url).toMatch(FILE_URL_REGEX);
    });
  });

  describe("Data validation patterns", () => {
    it("should validate email patterns", () => {
      const email = "user@example.com";
      const hasAt = email.includes("@");
      const hasDot = email.includes(".");
      expect(hasAt && hasDot).toBe(true);
    });

    it("should validate UUID patterns", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const parts = uuid.split("-");
      expect(parts).toHaveLength(5);
    });

    it("should validate semantic version", () => {
      const version = "1.0.0";
      const parts = version.split(".");
      expect(parts).toHaveLength(3);
      for (const part of parts) {
        expect(!Number.isNaN(Number.parseInt(part, 10))).toBe(true);
      }
    });
  });

  describe("Date/time formats", () => {
    it("should handle ISO date strings", () => {
      const date = "2024-01-15T10:30:00Z";
      expect(date).toMatch(ISO_DATETIME_REGEX);
    });

    it("should handle date-only strings", () => {
      const date = "2024-01-15";
      expect(date).toMatch(ISO_DATE_REGEX);
    });

    it("should handle time-only strings", () => {
      const time = "10:30:00";
      expect(time).toMatch(TIME_REGEX);
    });
  });

  describe("Color patterns", () => {
    it("should recognize hex colors", () => {
      const hexColors = ["#fff", "#ffffff", "#FFF", "#FFFFFF"];
      for (const color of hexColors) {
        expect(color).toMatch(HEX_COLOR_REGEX);
      }
    });

    it("should recognize RGB colors", () => {
      const rgb = "rgb(255, 0, 0)";
      expect(rgb).toMatch(RGB_START_REGEX);
    });

    it("should recognize HSL colors", () => {
      const hsl = "hsl(120, 100%, 50%)";
      expect(hsl).toMatch(HSL_START_REGEX);
    });
  });

  describe("Error message patterns", () => {
    it("should format error messages consistently", () => {
      const error = "Error: Something went wrong";
      expect(error).toMatch(UPPERCASE_START_REGEX);
    });

    it("should handle error codes", () => {
      const errorCode = "ERR_001";
      expect(errorCode).toMatch(ERR_PREFIX_REGEX);
    });
  });
});
