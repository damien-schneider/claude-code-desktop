import { os } from "@orpc/server";
import type { BrowserWindow } from "electron";

class IPCContext {
  mainWindow: BrowserWindow | undefined;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  get mainWindowContext() {
    if (!this.mainWindow) {
      throw new Error("Main window is not set in IPC context.");
    }

    const mainWindow = this.mainWindow;
    return os.middleware(({ next }) =>
      next({
        context: {
          window: mainWindow,
        },
      })
    );
  }
}

export const ipcContext = new IPCContext();
