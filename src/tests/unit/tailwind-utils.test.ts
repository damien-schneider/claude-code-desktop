/**
 * Pragmatic tests for tailwind utilities
 * Tests actual className merging behavior
 */
import { describe, expect, it } from "vitest";
import { cn } from "@/utils/tailwind";

describe("cn (className utility)", () => {
  it("should merge class names correctly", () => {
    const result = cn("px-2", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle conflicting Tailwind classes", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("should handle undefined and null values", () => {
    const result = cn("px-2", undefined, null, "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle empty strings", () => {
    const result = cn("px-2", "", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle conditional classes", () => {
    const result = cn("px-2", false, "block");
    expect(result).toBe("px-2 block");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["px-2", "py-1"], "text-sm");
    expect(result).toBe("px-2 py-1 text-sm");
  });

  it("should handle objects with boolean values", () => {
    const result = cn({
      "px-2": true,
      "py-1": false,
      "text-sm": true,
    });
    expect(result).toBe("px-2 text-sm");
  });

  it("should handle complex combinations", () => {
    const result = cn("px-2 py-1", { "text-sm": true, "text-lg": false }, [
      "bg-white",
      "dark:bg-black",
    ]);
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
    expect(result).toContain("text-sm");
    expect(result).toContain("bg-white");
    expect(result).toContain("dark:bg-black");
  });

  it("should handle dark mode conflicts", () => {
    const result = cn("dark:bg-white", "dark:bg-black");
    expect(result).toBe("dark:bg-black");
  });

  it("should handle responsive variants", () => {
    const result = cn("md:px-2", "md:px-4");
    expect(result).toBe("md:px-4");
  });

  it("should handle multiple conflicts", () => {
    const result = cn(
      "bg-white px-2 py-1 text-sm",
      "bg-black px-4 py-2 text-lg"
    );
    // tailwind-merge merges by keeping later conflicting classes
    expect(result).toBe("bg-black px-4 py-2 text-lg");
  });

  it("should handle no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle only falsy values", () => {
    const result = cn(false, null, undefined, "");
    expect(result).toBe("");
  });

  it("should preserve custom non-Tailwind classes", () => {
    const result = cn("custom-class", "another-class");
    expect(result).toContain("custom-class");
    expect(result).toContain("another-class");
  });
});
