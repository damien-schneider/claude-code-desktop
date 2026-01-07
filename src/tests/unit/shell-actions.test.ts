/**
 * Pragmatic tests for shell actions
 * Tests actual IPC communication for external link opening
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { openExternalLink } from "@/actions/shell";
import { ipc } from "@/ipc/manager";

// Mock IPC manager
vi.mock("@/ipc/manager", () => ({
  ipc: {
    client: {
      shell: {
        openExternalLink: vi.fn(),
      },
    },
  },
}));

describe("Shell Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("openExternalLink", () => {
    it("should open external URL", async () => {
      vi.mocked(ipc.client.shell.openExternalLink).mockResolvedValue(undefined);

      await openExternalLink("https://example.com");

      expect(ipc.client.shell.openExternalLink).toHaveBeenCalledWith({
        url: "https://example.com",
      });
    });

    it("should open HTTP URLs", async () => {
      vi.mocked(ipc.client.shell.openExternalLink).mockResolvedValue(undefined);

      await openExternalLink("http://example.com");

      expect(ipc.client.shell.openExternalLink).toHaveBeenCalledWith({
        url: "http://example.com",
      });
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(ipc.client.shell.openExternalLink).mockRejectedValue(
        new Error("Failed to open")
      );

      await expect(openExternalLink("https://example.com")).rejects.toThrow(
        "Failed to open"
      );
    });

    it("should handle mailto links", async () => {
      vi.mocked(ipc.client.shell.openExternalLink).mockResolvedValue(undefined);

      await openExternalLink("mailto:test@example.com");

      expect(ipc.client.shell.openExternalLink).toHaveBeenCalledWith({
        url: "mailto:test@example.com",
      });
    });

    it("should handle file:// URLs", async () => {
      vi.mocked(ipc.client.shell.openExternalLink).mockResolvedValue(undefined);

      await openExternalLink("file:///path/to/file");

      expect(ipc.client.shell.openExternalLink).toHaveBeenCalledWith({
        url: "file:///path/to/file",
      });
    });
  });
});
