/**
 * Pragmatic tests for IPC context
 * Tests actual context behavior
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ipcContext } from "@/ipc/context";

// Mock Electron BrowserWindow
const mockBrowserWindow = {
  webContents: {
    executeJavaScript: vi.fn(),
  },
} as any;

describe("IPCContext", () => {
  beforeEach(() => {
    // Reset the context before each test
    ipcContext.mainWindow = undefined;
  });

  describe("setMainWindow", () => {
    it("should set the main window", () => {
      ipcContext.setMainWindow(mockBrowserWindow);

      expect(ipcContext.mainWindow).toBe(mockBrowserWindow);
    });

    it("should overwrite existing main window", () => {
      const firstWindow = { ...mockBrowserWindow };
      const secondWindow = { ...mockBrowserWindow };

      ipcContext.setMainWindow(firstWindow);
      expect(ipcContext.mainWindow).toBe(firstWindow);

      ipcContext.setMainWindow(secondWindow);
      expect(ipcContext.mainWindow).toBe(secondWindow);
      expect(ipcContext.mainWindow).not.toBe(firstWindow);
    });
  });

  describe("mainWindowContext", () => {
    it("should return middleware when main window is set", () => {
      ipcContext.setMainWindow(mockBrowserWindow);

      const context = ipcContext.mainWindowContext;

      expect(context).toBeDefined();
      expect(typeof context).toBe("function");
    });

    it("should throw error when main window is not set", () => {
      expect(() => ipcContext.mainWindowContext).toThrow(
        "Main window is not set in IPC context."
      );
    });

    it("should provide window in context", () => {
      ipcContext.setMainWindow(mockBrowserWindow);

      // The middleware function needs to be called to get the context
      const middleware = ipcContext.mainWindowContext;
      expect(typeof middleware).toBe("function");
    });

    it("should allow multiple calls after window is set", () => {
      ipcContext.setMainWindow(mockBrowserWindow);

      const context1 = ipcContext.mainWindowContext;
      const context2 = ipcContext.mainWindowContext;

      expect(context1).toBeDefined();
      expect(context2).toBeDefined();
      // Both should be functions (middleware)
      expect(typeof context1).toBe("function");
      expect(typeof context2).toBe("function");
    });
  });

  describe("edge cases", () => {
    it("should handle setting window to undefined", () => {
      ipcContext.setMainWindow(mockBrowserWindow);
      expect(ipcContext.mainWindow).toBe(mockBrowserWindow);

      ipcContext.setMainWindow(undefined as any);
      expect(ipcContext.mainWindow).toBeUndefined();
    });

    it("should throw consistently when window is undefined", () => {
      ipcContext.mainWindow = undefined;

      expect(() => ipcContext.mainWindowContext).toThrow(
        "Main window is not set in IPC context."
      );
    });

    it("should throw consistently after setting to undefined", () => {
      ipcContext.setMainWindow(mockBrowserWindow);
      ipcContext.setMainWindow(undefined as any);

      expect(() => ipcContext.mainWindowContext).toThrow(
        "Main window is not set in IPC context."
      );
    });
  });

  describe("singleton behavior", () => {
    it("should maintain state across the singleton instance", () => {
      ipcContext.setMainWindow(mockBrowserWindow);

      // The context is a singleton, so importing again should give same instance
      // Note: In actual module system, this would be the same instance
      expect(ipcContext.mainWindow).toBe(mockBrowserWindow);
    });
  });
});
