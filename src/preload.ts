import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "./constants";

// Expose IPC methods to renderer process
contextBridge.exposeInMainWorld("electron", {
  on: (channel: string, callback: (...args: any[]) => void) => {
    // Deliberately strip event as it includes `sender`
    const validChannels = ["claude-process-event"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = ["claude-process-event"];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback as any);
    }
  },
});

window.addEventListener("message", (event) => {
  if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
    const [serverPort] = event.ports;

    ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [serverPort]);
  }
});
