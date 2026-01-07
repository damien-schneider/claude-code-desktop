import { type ClientContext, createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/message-port";
import type { RouterClient } from "@orpc/server";
import { IPC_CHANNELS } from "@/constants";
import type { router } from "./router";

type RPCClient = RouterClient<typeof router>;

// Check if we're in a test environment or browser environment
const isBrowser =
  typeof window !== "undefined" && typeof MessageChannel !== "undefined";

class IPCManager {
  private readonly clientPort: MessagePort | null;
  private readonly serverPort: MessagePort | null;

  private readonly rpcLink: RPCLink<ClientContext> | null;

  public readonly client: RPCClient;

  private initialized = false;

  constructor() {
    if (!isBrowser) {
      // In test/Node environment, create a mock client
      this.clientPort = null;
      this.serverPort = null;
      this.rpcLink = null;
      this.client = {} as RPCClient;
      return;
    }

    const { port1: clientChannelPort, port2: serverChannelPort } =
      new MessageChannel();
    this.clientPort = clientChannelPort;
    this.serverPort = serverChannelPort;

    this.rpcLink = new RPCLink({
      port: this.clientPort,
    });
    this.client = createORPCClient(this.rpcLink);
  }

  public initialize() {
    if (this.initialized || !isBrowser) {
      return;
    }

    this.clientPort?.start();

    window.postMessage(IPC_CHANNELS.START_ORPC_SERVER, "*", [this.serverPort]);
    this.initialized = true;
  }
}

export const ipc = new IPCManager();

// Only initialize in browser environment
if (isBrowser) {
  ipc.initialize();
}
