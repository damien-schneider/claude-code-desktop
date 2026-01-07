/**
 * Pragmatic tests for IPC theme schemas
 * Tests actual schema validation
 */
import { describe, expect, it } from "vitest";
import { setThemeModeInputSchema } from "@/ipc/theme/schemas";

describe("setThemeModeInputSchema", () => {
  it("should accept 'light' theme", () => {
    const result = setThemeModeInputSchema.safeParse("light");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("light");
    }
  });

  it("should accept 'dark' theme", () => {
    const result = setThemeModeInputSchema.safeParse("dark");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("dark");
    }
  });

  it("should accept 'system' theme", () => {
    const result = setThemeModeInputSchema.safeParse("system");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("system");
    }
  });

  it("should reject invalid theme", () => {
    const result = setThemeModeInputSchema.safeParse("invalid");

    expect(result.success).toBe(false);
  });

  it("should reject 'auto' theme", () => {
    const result = setThemeModeInputSchema.safeParse("auto");

    expect(result.success).toBe(false);
  });

  it("should reject empty string", () => {
    const result = setThemeModeInputSchema.safeParse("");

    expect(result.success).toBe(false);
  });

  it("should reject undefined", () => {
    const result = setThemeModeInputSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });

  it("should reject null", () => {
    const result = setThemeModeInputSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("should reject number", () => {
    const result = setThemeModeInputSchema.safeParse(123);

    expect(result.success).toBe(false);
  });

  it("should reject boolean", () => {
    const result = setThemeModeInputSchema.safeParse(true);

    expect(result.success).toBe(false);
  });

  it("should reject object", () => {
    const result = setThemeModeInputSchema.safeParse({ theme: "dark" });

    expect(result.success).toBe(false);
  });
});
