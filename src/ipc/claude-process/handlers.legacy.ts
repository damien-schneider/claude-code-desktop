import { os } from "@orpc/server";
import { exec, spawn } from "child_process";
import { EventEmitter } from "events";
import { homedir } from "os";
import { promisify } from "util";
import { z } from "zod";
import { ipcContext } from "@/ipc/context";

const execAsync = promisify(exec);

/**
 * Send event to renderer process via webContents
 */
function sendToRenderer(event: string, data: any) {
  // Get the main window from the IPC context
  const window = ipcContext.mainWindow;
  if (window?.webContents) {
    window.webContents.send("claude-process-event", { event, data });
  }
}

/**
 * Find the claude CLI binary.
 * Uses shell to find claude with proper PATH environment.
 * This is necessary because Electron's PATH differs from the shell's PATH.
 */
async function findClaudePath(): Promise<string> {
  // Use the user's shell to find claude, which will have the correct PATH
  const shell = process.env.SHELL || "/bin/zsh";

  try {
    // Use shell -l to get a login shell with complete environment
    const { stdout } = await execAsync(
      `"${shell}" -l -c 'which claude 2>/dev/null || echo NOT_FOUND'`,
      {
        env: {
          // Ensure we have a minimal PATH for the shell
          PATH:
            process.env.PATH ||
            "/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin",
        },
      }
    );

    const claudePath = stdout.trim();
    if (claudePath && claudePath !== "NOT_FOUND") {
      console.log(`[getClaudePath] Found claude via shell: ${claudePath}`);
      return claudePath;
    }
  } catch (error) {
    console.warn("[getClaudePath] Shell lookup failed:", error);
  }

  // Fallback: try known paths directly
  const possiblePaths = [
    `${homedir()}/.local/bin/claude`,
    `${homedir()}/.npm-global/bin/claude`,
    "/usr/local/bin/claude",
  ];

  for (const path of possiblePaths) {
    try {
      await execAsync(`test -f "${path}" && test -x "${path}"`);
      console.log(`[getClaudePath] Found claude at: ${path}`);
      return path;
    } catch {
      // Continue to next path
    }
  }

  console.warn(
    "[getClaudePath] Could not find claude binary, falling back to 'claude'"
  );
  return "claude";
}

// Cache the path so we only look it up once
let cachedClaudePath: string | null = null;

async function getClaudePath(): Promise<string> {
  if (!cachedClaudePath) {
    cachedClaudePath = await findClaudePath();
  }
  return cachedClaudePath;
}

/**
 * Store active claude CLI processes
 * Key: processId, Value: ChildProcess
 */
const activeProcesses = new Map<string, any>();

/**
 * Permission modes for Claude Code sessions
 * These are dynamically fetched from the CLI
 */
export type PermissionMode =
  | "default"
  | "plan"
  | "acceptEdits"
  | "bypassPermissions"
  | "delegate"
  | "dontAsk";

/**
 * Cache for permission modes to avoid repeated CLI calls
 */
let permissionModesCache: PermissionMode[] | null = null;

/**
 * Get available permission modes from Claude CLI
 * Parses the --help output to dynamically fetch available modes
 */
export const getPermissionModes = os.handler(async () => {
  // Return cached modes if available
  if (permissionModesCache) {
    return { modes: permissionModesCache };
  }

  try {
    // Execute claude --help and parse permission modes
    const claudeBin = await getClaudePath();
    const { stdout } = await execAsync(`${claudeBin} --help`);

    // Parse the permission mode choices from help output
    // Format: --permission-mode <mode> ... (choices: "mode1", "mode2", ...)
    const match = stdout.match(/--permission-mode.*?choices:\s*([^)]+)\)/);

    if (match && match[1]) {
      // Parse the choices and clean up quotes
      const modes = match[1]
        .split(",")
        .map((m) => m.trim().replace(/"/g, ""))
        .filter(Boolean);

      permissionModesCache = modes as PermissionMode[];
      return { modes };
    }

    // Fallback to default modes if parsing fails
    const defaultModes: PermissionMode[] = [
      "default",
      "plan",
      "acceptEdits",
      "bypassPermissions",
      "delegate",
      "dontAsk",
    ];
    permissionModesCache = defaultModes;
    return { modes: defaultModes };
  } catch (error) {
    console.error("[getPermissionModes] Failed to fetch from CLI:", error);

    // Fallback to default modes on error
    const defaultModes: PermissionMode[] = [
      "default",
      "plan",
      "acceptEdits",
      "bypassPermissions",
      "delegate",
      "dontAsk",
    ];
    permissionModesCache = defaultModes;
    return { modes: defaultModes };
  }
});

/**
 * Event emitter for streaming messages to renderer
 */
export const processEvents = new EventEmitter();

/**
 * Permission modes for Claude Code sessions
 * Reference: https://github.com/anthropics/claude-code/issues/6227
 */
export type PermissionMode =
  | "default"
  | "plan"
  | "acceptEdits"
  | "bypassPermissions";

/**
 * Start a new Claude CLI session
 * Spawns the claude command with optional session-id or continue flag
 */
export const startClaudeSession = os
  .input(
    z.object({
      projectPath: z.string(),
      sessionId: z.string().optional(),
      continueLast: z.boolean().optional(),
      permissionMode: z.string().optional(),
      agentName: z.string().optional(),
    })
  )
  .handler(
    async ({
      input: {
        projectPath,
        sessionId,
        continueLast,
        permissionMode,
        agentName,
      },
    }) => {
      const args: string[] = [];

      if (sessionId) {
        args.push("--session-id", sessionId);
      }
      if (continueLast) {
        args.push("-c");
      }
      if (permissionMode && permissionMode !== "default") {
        args.push("--permission-mode", permissionMode);
      }
      if (agentName) {
        args.push("--agent", agentName);
      }

      console.log(
        "[startClaudeSession] Spawning claude with args:",
        args,
        "in",
        projectPath
      );

      try {
        const claudePath = await getClaudePath();
        const env = {
          ...process.env,
          // Ensure PATH includes common locations
          PATH: `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin`,
          CLAUDE_DONT_PRINT_STARTUP: "1",
        };

        console.log("[startClaudeSession] Using claude path:", claudePath);
        console.log(
          "[startClaudeSession] Shell mode enabled for proper environment"
        );

        // Use shell: true to ensure proper PATH and environment resolution
        const claude = spawn(claudePath, args, {
          cwd: projectPath,
          env,
          stdio: ["pipe", "pipe", "pipe"],
          shell: true, // This is critical for proper PATH resolution on macOS
        });

        const processId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        activeProcesses.set(processId, claude);

        // Handle stdout (streaming responses)
        claude.stdout.on("data", (data) => {
          const content = data.toString();
          console.log("[claude stdout]:", content.slice(0, 100));
          const eventData = { processId, type: "chunk", content };
          processEvents.emit("message", eventData);
          sendToRenderer("message", eventData);
        });

        // Handle stderr
        claude.stderr.on("data", (data) => {
          const content = data.toString();
          console.log("[claude stderr]:", content.slice(0, 100));
          const eventData = { processId, type: "error", content };
          processEvents.emit("message", eventData);
          sendToRenderer("message", eventData);
        });

        // Handle exit
        claude.on("close", (code) => {
          console.log("[claude] Process closed with code:", code);
          const eventData = { processId, type: "complete", code };
          processEvents.emit("message", eventData);
          sendToRenderer("message", eventData);
          activeProcesses.delete(processId);
        });

        // Handle errors
        claude.on("error", (error) => {
          console.error("[claude] Process error:", error);
          const eventData = {
            processId,
            type: "error",
            content: error.message,
          };
          processEvents.emit("message", eventData);
          sendToRenderer("message", eventData);
          activeProcesses.delete(processId);
        });

        return { processId, sessionId };
      } catch (error) {
        console.error("[startClaudeSession] Failed to spawn:", error);
        throw error;
      }
    }
  );

/**
 * Send a message to the active claude session
 * Writes to the stdin of the spawned process
 */
export const sendMessage = os
  .input(
    z.object({
      processId: z.string(),
      message: z.string(),
    })
  )
  .handler(async ({ input: { processId, message } }) => {
    const claude = activeProcesses.get(processId);

    if (!claude) {
      throw new Error(`Process not found: ${processId}`);
    }

    if (!claude.stdin.writable) {
      throw new Error(`Process stdin is not writable: ${processId}`);
    }

    console.log("[sendMessage] Sending message to process:", processId);

    try {
      claude.stdin.write(message + "\n");
      return { success: true };
    } catch (error) {
      console.error("[sendMessage] Failed to write:", error);
      throw error;
    }
  });

/**
 * Stop a claude session
 * Kills the spawned process
 */
export const stopClaudeSession = os
  .input(
    z.object({
      processId: z.string(),
    })
  )
  .handler(async ({ input: { processId } }) => {
    const claude = activeProcesses.get(processId);

    if (claude) {
      console.log("[stopClaudeSession] Stopping process:", processId);

      try {
        // Try graceful shutdown first
        claude.kill("SIGTERM");

        // Force kill after 2 seconds if still alive
        setTimeout(() => {
          if (activeProcesses.has(processId)) {
            console.log(
              "[stopClaudeSession] Force killing process:",
              processId
            );
            claude.kill("SIGKILL");
          }
        }, 2000);

        return { success: true };
      } catch (error) {
        console.error("[stopClaudeSession] Failed to stop:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return { success: true, message: "Process not found" };
  });

/**
 * Get all active session process IDs
 */
export const getActiveSessions = os.handler(() => {
  return {
    processIds: Array.from(activeProcesses.keys()),
    count: activeProcesses.size,
  };
});

/**
 * Resume an existing Claude session
 * Uses --resume flag to load a previous session by ID
 */
export const resumeSession = os
  .input(
    z.object({
      projectPath: z.string(),
      sessionId: z.string(),
      permissionMode: z.string().optional(),
      agentName: z.string().optional(),
      forkSession: z.boolean().optional(),
    })
  )
  .handler(
    async ({
      input: { projectPath, sessionId, permissionMode, agentName, forkSession },
    }) => {
      const args: string[] = ["--resume", sessionId];

      if (permissionMode && permissionMode !== "default") {
        args.push("--permission-mode", permissionMode);
      }
      if (agentName) {
        args.push("--agent", agentName);
      }
      if (forkSession) {
        args.push("--fork-session");
      }

      console.log(
        "[resumeSession] Spawning claude with args:",
        args,
        "in",
        projectPath
      );

      try {
        const claudePath = await getClaudePath();
        const env = {
          ...process.env,
          // Ensure PATH includes common locations
          PATH: `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin`,
          CLAUDE_DONT_PRINT_STARTUP: "1",
        };

        console.log("[resumeSession] Using claude path:", claudePath);
        console.log(
          "[resumeSession] Shell mode enabled for proper environment"
        );

        const claude = spawn(claudePath, args, {
          cwd: projectPath,
          env,
          stdio: ["pipe", "pipe", "pipe"],
          shell: true, // This is critical for proper PATH resolution on macOS
        });

        const processId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;
        activeProcesses.set(processId, claude);

        // Handle stdout (streaming responses)
        claude.stdout.on("data", (data) => {
          const content = data.toString();
          console.log("[claude stdout]:", content.slice(0, 100));
          const eventData = { processId, type: "chunk", content };
          processEvents.emit("message", eventData);
          sendToRenderer("message", eventData);
        });

        // Handle stderr
        claude.stderr.on("data", (data) => {
          const content = data.toString();
          console.log("[claude stderr]:", content.slice(0, 100));
          const eventData = { processId, type: "error", content };
          processEvents.emit("message", eventData);
          sendToRenderer("message", eventData);
        });

        // Handle exit
        claude.on("close", (code) => {
          console.log("[claude] Process closed with code:", code);
          const eventData = { processId, type: "complete", code };
          processEvents.emit("message", eventData);
          sendToRenderer("message", eventData);
          activeProcesses.delete(processId);
        });

        // Handle errors
        claude.on("error", (error) => {
          console.error("[claude] Process error:", error);
          const eventData = {
            processId,
            type: "error",
            content: error.message,
          };
          processEvents.emit("message", eventData);
          sendToRenderer("message", eventData);
          activeProcesses.delete(processId);
        });

        return { processId, sessionId, resumed: true };
      } catch (error) {
        console.error("[resumeSession] Failed to spawn:", error);
        throw error;
      }
    }
  );
