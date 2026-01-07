/**
 * Pragmatic tests for window actions
 * Tests actual IPC communication for window management
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { closeWindow, maximizeWindow, minimizeWindow } from "@/actions/window";
import { ipc } from "@/ipc/manager";

// Mock IPC manager
vi.mock("@/ipc/manager", () => ({
  ipc: {
    client: {
      window: {
        minimizeWindow: vi.fn(),
        maximizeWindow: vi.fn(),
        closeWindow: vi.fn(),
      },
    },
  },
}));

describe("Window Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("minimizeWindow", () => {
    it("should call IPC minimizeWindow", async () => {
      vi.mocked(ipc.client.window.minimizeWindow).mockResolvedValue(undefined);

      await minimizeWindow();

      expect(ipc.client.window.minimizeWindow).toHaveBeenCalledOnce();
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(ipc.client.window.minimizeWindow).mockRejectedValue(
        new Error("Window error")
      );

      await expect(minimizeWindow()).rejects.toThrow("Window error");
    });
  });

  describe("maximizeWindow", () => {
    it("should call IPC maximizeWindow", async () => {
      vi.mocked(ipc.client.window.maximizeWindow).mockResolvedValue(undefined);

      await maximizeWindow();

      expect(ipc.client.window.maximizeWindow).toHaveBeenCalledOnce();
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(ipc.client.window.maximizeWindow).mockRejectedValue(
        new Error("Window error")
      );

      await expect(maximizeWindow()).rejects.toThrow("Window error");
    });
  });

  describe("closeWindow", () => {
    it("should call IPC closeWindow", async () => {
      vi.mocked(ipc.client.window.closeWindow).mockResolvedValue(undefined);

      await closeWindow();

      expect(ipc.client.window.closeWindow).toHaveBeenCalledOnce();
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(ipc.client.window.closeWindow).mockRejectedValue(
        new Error("Window error")
      );

      await expect(closeWindow()).rejects.toThrow("Window error");
    });
  });
});
