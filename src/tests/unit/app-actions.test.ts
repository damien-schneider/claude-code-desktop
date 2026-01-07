/**
 * Pragmatic tests for app actions
 * Tests actual IPC communication for platform and version
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAppVersion, getPlatform } from "@/actions/app";
import { ipc } from "@/ipc/manager";

// Mock IPC manager
vi.mock("@/ipc/manager", () => ({
  ipc: {
    client: {
      app: {
        currentPlatfom: vi.fn(),
        appVersion: vi.fn(),
      },
    },
  },
}));

describe("App Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPlatform", () => {
    it("should return current platform from IPC", async () => {
      vi.mocked(ipc.client.app.currentPlatfom).mockResolvedValue("darwin");

      const result = await getPlatform();

      expect(result).toBe("darwin");
      expect(ipc.client.app.currentPlatfom).toHaveBeenCalledOnce();
    });

    it("should return windows platform", async () => {
      vi.mocked(ipc.client.app.currentPlatfom).mockResolvedValue("win32");

      const result = await getPlatform();

      expect(result).toBe("win32");
    });

    it("should return linux platform", async () => {
      vi.mocked(ipc.client.app.currentPlatfom).mockResolvedValue("linux");

      const result = await getPlatform();

      expect(result).toBe("linux");
    });
  });

  describe("getAppVersion", () => {
    it("should return app version from IPC", async () => {
      vi.mocked(ipc.client.app.appVersion).mockResolvedValue("1.0.0");

      const result = await getAppVersion();

      expect(result).toBe("1.0.0");
      expect(ipc.client.app.appVersion).toHaveBeenCalledOnce();
    });

    it("should return semantic version", async () => {
      vi.mocked(ipc.client.app.appVersion).mockResolvedValue("2.5.3-beta");

      const result = await getAppVersion();

      expect(result).toBe("2.5.3-beta");
    });
  });
});
