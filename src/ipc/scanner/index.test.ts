/**
 * Pragmatic tests for IPC scanner handlers
 * Tests project scanning functionality
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock scanner functions
vi.mock("../../main/scanner", () => ({
  getDefaultScanPaths: vi.fn(() => ["/default/path"]),
  scanForProjects: vi.fn(() => Promise.resolve({ projects: [], errors: [] })),
  scanMultipleDirectories: vi.fn(() =>
    Promise.resolve({ projects: [], errors: [] })
  ),
}));

// Mock scanner cache functions
vi.mock("../../main/scanner/cache", () => ({
  isCacheValid: vi.fn(() => Promise.resolve(false)),
  loadCachedProjects: vi.fn(() => Promise.resolve([])),
  saveProjectsToCache: vi.fn(() => Promise.resolve()),
  clearProjectCache: vi.fn(() => Promise.resolve()),
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

describe("IPC Scanner Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("module exports", () => {
    it("should export scanner object", async () => {
      const mod = await import("./index");
      expect(mod.scanner).toBeDefined();
      expect(typeof mod.scanner).toBe("object");
    });

    it("should export scanner.scanProjects", async () => {
      const mod = await import("./index");
      expect(mod.scanner.scanProjects).toBeDefined();
    });

    it("should export scanner.scanDirectory", async () => {
      const mod = await import("./index");
      expect(mod.scanner.scanDirectory).toBeDefined();
    });

    it("should export scanner.getCachedProjects", async () => {
      const mod = await import("./index");
      expect(mod.scanner.getCachedProjects).toBeDefined();
    });

    it("should export scanner.getDefaultPaths", async () => {
      const mod = await import("./index");
      expect(mod.scanner.getDefaultPaths).toBeDefined();
    });

    it("should export scanner.clearCache", async () => {
      const mod = await import("./index");
      expect(mod.scanner.clearCache).toBeDefined();
    });

    it("should export scanner.checkCacheValid", async () => {
      const mod = await import("./index");
      expect(mod.scanner.checkCacheValid).toBeDefined();
    });
  });
});
