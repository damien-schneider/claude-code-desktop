/**
 * Pragmatic tests for IPC shell handlers
 * Tests external link opening functionality
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Electron's shell
const mockShell = {
  openExternal: vi.fn(),
};

vi.mock("electron", () => ({
  shell: mockShell,
}));

// Mock @orpc/server
const mockHandler = vi.fn((fn) => fn);
const mockInput = vi.fn((_schema) => ({
  handler: mockHandler,
}));

vi.mock("@orpc/server", () => ({
  os: {
    handler: mockHandler,
    input: mockInput,
  },
}));

describe("IPC Shell Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("module exports", () => {
    it("should export shell object", async () => {
      const mod = await import("./index");
      expect(mod.shell).toBeDefined();
      expect(typeof mod.shell).toBe("object");
    });

    it("should export shell.openExternalLink", async () => {
      const mod = await import("./index");
      expect(mod.shell.openExternalLink).toBeDefined();
    });
  });
});
