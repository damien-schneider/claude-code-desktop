/**
 * Pragmatic tests for ThemeMode type
 * Tests type definitions and values
 */
import { describe, expect, it } from "vitest";
import type { ThemeMode } from "@/types/theme-mode";

describe("ThemeMode Type", () => {
  it("should accept 'dark' as valid theme mode", () => {
    const mode: ThemeMode = "dark";
    expect(mode).toBe("dark");
  });

  it("should accept 'light' as valid theme mode", () => {
    const mode: ThemeMode = "light";
    expect(mode).toBe("light");
  });

  it("should accept 'system' as valid theme mode", () => {
    const mode: ThemeMode = "system";
    expect(mode).toBe("system");
  });

  it("should support all theme modes", () => {
    const modes: ThemeMode[] = ["dark", "light", "system"];
    expect(modes).toHaveLength(3);
  });

  it("should type check correctly", () => {
    const validMode = (mode: ThemeMode): boolean => {
      return ["dark", "light", "system"].includes(mode);
    };

    expect(validMode("dark")).toBe(true);
    expect(validMode("light")).toBe(true);
    expect(validMode("system")).toBe(true);
  });

  it("should allow mode assignment", () => {
    let currentMode: ThemeMode;
    currentMode = "dark";
    expect(currentMode).toBe("dark");

    currentMode = "light";
    expect(currentMode).toBe("light");

    currentMode = "system";
    expect(currentMode).toBe("system");
  });
});
