/**
 * Pragmatic tests for IPC shell schemas
 * Tests actual schema validation
 */
import { describe, expect, it } from "vitest";
import { openExternalLinkInputSchema } from "@/ipc/shell/schemas";

describe("openExternalLinkInputSchema", () => {
  it("should accept valid URL", () => {
    const result = openExternalLinkInputSchema.safeParse({
      url: "https://example.com",
    });

    expect(result.success).toBe(true);
  });

  it("should accept http URL", () => {
    const result = openExternalLinkInputSchema.safeParse({
      url: "http://example.com",
    });

    expect(result.success).toBe(true);
  });

  it("should accept URL with path and query", () => {
    const result = openExternalLinkInputSchema.safeParse({
      url: "https://example.com/path?query=value",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid URL", () => {
    const result = openExternalLinkInputSchema.safeParse({
      url: "not-a-url",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty URL", () => {
    const result = openExternalLinkInputSchema.safeParse({
      url: "",
    });

    expect(result.success).toBe(false);
  });

  it("should reject missing url field", () => {
    const result = openExternalLinkInputSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
