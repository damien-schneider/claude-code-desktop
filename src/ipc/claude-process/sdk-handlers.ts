import { os } from "@orpc/server";
import { z } from "zod";
import { EventEmitter } from "events";
import { exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { existsSync } from "fs";
import { join } from "path";
import { readdir } from "fs/promises";
import { ipcContext } from "@/ipc/context";
import type {
  SDKMessage,
  SDKAssistantMessage,
  SDKUserMessage,
  SDKResultMessage,
  SDKSystemMessage,
  SDKPartialAssistantMessage,
  Query,
} from "@anthropic-ai/claude-agent-sdk";
import { query as sdkQuery } from "@anthropic-ai/claude-agent-sdk";

const execAsync = promisify(exec);

// =============================================================================
// Claude CLI Path Discovery
// =============================================================================

/**
 * Find the Claude Code CLI executable path
 * Checks common installation locations
 */
function findClaudeExecutable(): string | null {
  const homeDir = homedir();

  // Common paths where Claude CLI might be installed
  const possiblePaths = [
    // User local bin (common for npm -g or homebrew)
    join(homeDir, ".local", "bin", "claude"),
    // Homebrew on macOS
    "/usr/local/bin/claude",
    "/opt/homebrew/bin/claude",
    // Linux global
    "/usr/bin/claude",
    // npm global (varies by system)
    join(homeDir, ".npm-global", "bin", "claude"),
    // volta
    join(homeDir, ".volta", "bin", "claude"),
    // nvm
    join(homeDir, ".nvm", "versions", "node", "current", "bin", "claude"),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log("[SDK] Found Claude CLI at:", path);
      return path;
    }
  }

  return null;
}

// Cache the executable path
let cachedClaudeExecutablePath: string | null | undefined;

/**
 * Get the Claude CLI executable path, with caching
 */
function getClaudeExecutablePath(): string | null {
  if (cachedClaudeExecutablePath === undefined) {
    cachedClaudeExecutablePath = findClaudeExecutable();
  }
  return cachedClaudeExecutablePath;
}

/**
 * Clear the cached executable path (useful if user installs Claude during session)
 */
export function clearClaudeExecutableCache(): void {
  cachedClaudeExecutablePath = undefined;
}

// =============================================================================
// Types
// =============================================================================

export interface ProcessState {
  processId: string;
  sessionId: string;
  projectPath: string; // Store the project path for resuming
  query: Query | null;
  abortController: AbortController;
  isActive: boolean;
}

export type PermissionMode =
  | "default"
  | "plan"
  | "acceptEdits"
  | "bypassPermissions"
  | "delegate"
  | "dontAsk";

// Re-export SDK types for consumers
export type {
  SDKMessage,
  SDKAssistantMessage,
  SDKUserMessage,
  SDKResultMessage,
  SDKSystemMessage,
  SDKPartialAssistantMessage,
};

// =============================================================================
// Event Emitter
// =============================================================================

export const processEvents = new EventEmitter();

// =============================================================================
// State Management
// =============================================================================

const activeProcesses = new Map<string, ProcessState>();

// =============================================================================
// Helpers
// =============================================================================

function sendToRenderer(event: string, data: unknown) {
  const window = ipcContext.mainWindow;
  if (window?.webContents) {
    window.webContents.send("claude-process-event", { event, data });
  }
}

function generateProcessId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Check if Claude Code CLI is available
 */
export async function checkClaudeAvailability(): Promise<{
  available: boolean;
  version?: string;
  executablePath?: string;
  error?: string;
}> {
  // First, try to find the executable directly
  const executablePath = getClaudeExecutablePath();

  if (executablePath) {
    try {
      const { stdout } = await execAsync(
        `"${executablePath}" --version 2>/dev/null`
      );
      const version = stdout.trim();
      if (version) {
        return { available: true, version, executablePath };
      }
    } catch {
      // Fall through to shell-based check
    }
  }

  // Fallback: try to find via shell PATH
  try {
    const shell = process.env.SHELL || "/bin/zsh";
    const { stdout } = await execAsync(
      `"${shell}" -l -c 'which claude 2>/dev/null && claude --version 2>/dev/null || echo NOT_FOUND'`,
      {
        env: {
          PATH:
            process.env.PATH ||
            `/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:${homedir()}/.local/bin`,
        },
      }
    );

    const lines = stdout.trim().split("\n");
    if (lines.length >= 2 && lines[0] !== "NOT_FOUND") {
      const foundPath = lines[0];
      const version = lines.slice(1).join("\n").trim();

      // Update cache with found path
      cachedClaudeExecutablePath = foundPath;

      return { available: true, version, executablePath: foundPath };
    }

    return {
      available: false,
      error:
        "Claude Code CLI not found. Please install it: npm install -g @anthropic-ai/claude-code",
    };
  } catch (error) {
    return {
      available: false,
      error: `Failed to check Claude availability: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// =============================================================================
// SDK Handlers
// =============================================================================

/**
 * Check if Claude CLI is available
 */
export const checkClaude = os.handler(async () => {
  return checkClaudeAvailability();
});

/**
 * Get available permission modes
 */
export const getPermissionModes = os.handler(async () => {
  // These are the standard permission modes from Claude Code
  const modes: PermissionMode[] = [
    "default",
    "plan",
    "acceptEdits",
    "bypassPermissions",
    "delegate",
    "dontAsk",
  ];
  return { modes };
});

/**
 * Start a new Claude session using the SDK
 */
export const startClaudeSession = os
  .input(
    z.object({
      projectPath: z.string(),
      sessionId: z.string().optional(),
      continueLast: z.boolean().optional(),
      permissionMode: z.string().optional(),
      agentName: z.string().optional(),
      initialMessage: z.string().optional(),
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
        initialMessage,
      },
    }) => {
      const processId = generateProcessId();
      const abortController = new AbortController();

      console.log(
        "[SDK:startClaudeSession] Starting session with SDK for:",
        projectPath
      );

      const state: ProcessState = {
        processId,
        sessionId: sessionId || processId,
        projectPath, // Store the project path
        query: null,
        abortController,
        isActive: true,
      };

      activeProcesses.set(processId, state);

      // If there's an initial message, start processing it
      if (initialMessage) {
        processMessage(processId, projectPath, initialMessage, {
          continue: continueLast,
          permissionMode: permissionMode as PermissionMode,
        });
      }

      return { processId, sessionId: state.sessionId };
    }
  );

/**
 * Send a message to the active session
 */
export const sendMessage = os
  .input(
    z.object({
      processId: z.string(),
      message: z.string(),
      projectPath: z.string().optional(),
    })
  )
  .handler(async ({ input: { processId, message, projectPath } }) => {
    const state = activeProcesses.get(processId);

    if (!state) {
      throw new Error(`Process not found: ${processId}`);
    }

    if (!state.isActive) {
      throw new Error(`Process is no longer active: ${processId}`);
    }

    console.log("[SDK:sendMessage] Sending message to process:", processId);

    // Use stored project path, or provided one, or fallback to cwd
    const cwd = state.projectPath || projectPath || process.cwd();

    console.log("[SDK:sendMessage] Using cwd:", cwd);
    console.log("[SDK:sendMessage] Resume session:", state.sessionId);

    // Process the message
    processMessage(processId, cwd, message, {
      resume: state.sessionId,
    });

    return { success: true };
  });

/**
 * Internal function to process messages using the SDK
 */
async function processMessage(
  processId: string,
  projectPath: string,
  message: string,
  options: {
    continue?: boolean;
    resume?: string;
    permissionMode?: PermissionMode;
  } = {}
): Promise<void> {
  const state = activeProcesses.get(processId);
  if (!state) return;

  try {
    console.log("[SDK:processMessage] Processing message with SDK query()");
    console.log("[SDK:processMessage] Project path:", projectPath);
    console.log("[SDK:processMessage] Resume session:", options.resume);
    console.log(
      "[SDK:processMessage] Permission mode:",
      options.permissionMode
    );

    // Get the Claude executable path
    const executablePath = getClaudeExecutablePath();
    if (!executablePath) {
      const error =
        "Claude Code CLI not found. Please install it: npm install -g @anthropic-ai/claude-code";
      console.error("[SDK:processMessage]", error);

      sendToRenderer("message", {
        processId,
        type: "error",
        content: error,
      });

      processEvents.emit("message", {
        processId,
        type: "error",
        content: error,
      });
      return;
    }

    // If resuming, verify the session file exists first
    if (options.resume) {
      const sanitizedPath = projectPath.replace(/\//g, "-").replace(/\\/g, "-");
      const sessionDir = join(homedir(), ".claude", "projects", sanitizedPath);
      const sessionFile = join(sessionDir, `${options.resume}.jsonl`);

      console.log(
        "[SDK:processMessage] Looking for session file:",
        sessionFile
      );

      if (!existsSync(sessionFile)) {
        // List available session files for debugging
        try {
          const files = await readdir(sessionDir);
          console.log("[SDK:processMessage] Available session files:", files);
        } catch (e) {
          console.log(
            "[SDK:processMessage] Session directory doesn't exist:",
            sessionDir
          );
        }

        const error =
          `Session file not found: ${sessionFile}\n\n` +
          `The session ${options.resume} doesn't exist at the expected location.\n` +
          `This can happen if:\n` +
          `1. The session was deleted\n` +
          `2. The project path changed\n` +
          `3. The session was never saved\n\n` +
          `Expected path: ${sessionFile}`;

        console.error("[SDK:processMessage]", error);

        sendToRenderer("message", {
          processId,
          type: "error",
          content: error,
        });

        processEvents.emit("message", {
          processId,
          type: "error",
          content: error,
        });
        return;
      }

      console.log(
        "[SDK:processMessage] Session file exists, proceeding with resume"
      );
    }

    // Send system init event
    sendToRenderer("message", {
      processId,
      type: "system",
      subtype: "init",
      content: "Starting Claude session...",
    });

    // Build environment with proper PATH for Claude CLI
    // Electron main process may not have the full shell environment
    const homeDir = homedir();
    const enhancedEnv = {
      ...process.env,
      // Ensure common bin paths are in PATH
      PATH: [
        process.env.PATH,
        join(homeDir, ".local", "bin"),
        "/usr/local/bin",
        "/opt/homebrew/bin",
        join(homeDir, ".volta", "bin"),
        join(homeDir, ".nvm", "versions", "node", "current", "bin"),
      ]
        .filter(Boolean)
        .join(":"),
      // Ensure HOME is set (needed for ~/.claude credentials)
      HOME: homeDir,
    };

    // Build the query options
    const queryOptions: Parameters<typeof sdkQuery>[0]["options"] = {
      cwd: projectPath,
      pathToClaudeCodeExecutable: executablePath,
      abortController: state.abortController,
      permissionMode: options.permissionMode || "default",
      model: "claude-sonnet-4-20250514",
      settingSources: ["user", "project"], // Load user settings (auth) and project settings (CLAUDE.md)
      includePartialMessages: true, // Enable streaming partial messages
      env: enhancedEnv, // Pass enhanced environment with proper PATH and HOME
    };

    // Add resume or continue option (they are mutually exclusive)
    if (options.resume) {
      queryOptions.resume = options.resume;
      console.log("[SDK:processMessage] Resuming session:", options.resume);
    } else if (options.continue) {
      queryOptions.continue = true;
      console.log("[SDK:processMessage] Continuing last session");
    }

    console.log(
      "[SDK:processMessage] Query options:",
      JSON.stringify(
        {
          cwd: queryOptions.cwd,
          resume: queryOptions.resume,
          continue: queryOptions.continue,
          permissionMode: queryOptions.permissionMode,
          model: queryOptions.model,
        },
        null,
        2
      )
    );

    // Create the query using the SDK with the executable path
    const queryResult = sdkQuery({
      prompt: message,
      options: queryOptions,
    });

    state.query = queryResult;

    // Track if we received a valid result (to handle exit code 1 after success)
    let receivedResult = false;
    let resultIsError = false;

    // Process streaming messages
    for await (const sdkMessage of queryResult) {
      if (!state.isActive) {
        break;
      }

      // Track result messages
      if (sdkMessage.type === "result") {
        receivedResult = true;
        const resultMsg = sdkMessage as SDKResultMessage;
        resultIsError = resultMsg.is_error || resultMsg.subtype !== "success";
        console.log("[SDK:processMessage] Received result:", {
          subtype: resultMsg.subtype,
          isError: resultMsg.is_error,
          numTurns: resultMsg.num_turns,
        });
      }

      handleSDKMessage(processId, sdkMessage);
    }

    // Send completion event
    console.log("[SDK:processMessage] Query completed successfully");
    sendToRenderer("message", {
      processId,
      type: "complete",
      code: resultIsError ? 1 : 0,
    });

    processEvents.emit("message", {
      processId,
      type: "complete",
      code: resultIsError ? 1 : 0,
    });
  } catch (error) {
    // Check if this is just a process exit after successful completion
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isExitCode1 = errorMessage.includes("exited with code 1");

    // If we received a result before the error, this might just be normal process cleanup
    // The SDK sometimes throws after the generator completes
    const state = activeProcesses.get(processId);

    if (isExitCode1) {
      // Log but don't necessarily treat as fatal error
      console.warn(
        "[SDK:processMessage] Process exited with code 1 (may be normal after completion):",
        {
          projectPath,
          sessionId: options.resume,
          permissionMode: options.permissionMode,
        }
      );

      // Send a completion event instead of error if we got this far
      // (the for-await loop completed which means messages were processed)
      sendToRenderer("message", {
        processId,
        type: "complete",
        code: 1,
        warning: "Process exited with code 1, but messages were received",
      });

      processEvents.emit("message", {
        processId,
        type: "complete",
        code: 1,
        warning: "Process exited with code 1, but messages were received",
      });
      return;
    }

    console.error("[SDK:processMessage] Error:", error);

    sendToRenderer("message", {
      processId,
      type: "error",
      content: errorMessage,
    });

    processEvents.emit("message", {
      processId,
      type: "error",
      content: errorMessage,
    });
  }
}

/**
 * Handle individual SDK messages and forward to renderer
 */
function handleSDKMessage(processId: string, message: SDKMessage) {
  console.log("[SDK:handleSDKMessage] Received message type:", message.type);

  switch (message.type) {
    case "assistant": {
      const assistantMsg = message as SDKAssistantMessage;
      const eventData = {
        processId,
        type: "assistant",
        uuid: assistantMsg.uuid,
        sessionId: assistantMsg.session_id,
        message: assistantMsg.message,
        parentToolUseId: assistantMsg.parent_tool_use_id,
      };
      sendToRenderer("message", eventData);
      processEvents.emit("message", eventData);
      break;
    }

    case "user": {
      const userMsg = message as SDKUserMessage;
      const eventData = {
        processId,
        type: "user",
        uuid: userMsg.uuid,
        sessionId: userMsg.session_id,
        message: userMsg.message,
        parentToolUseId: userMsg.parent_tool_use_id,
      };
      sendToRenderer("message", eventData);
      processEvents.emit("message", eventData);
      break;
    }

    case "result": {
      const resultMsg = message as SDKResultMessage;

      // Extract errors if present (for error subtypes)
      const errors = "errors" in resultMsg ? resultMsg.errors : undefined;

      const eventData = {
        processId,
        type: "result",
        subtype: resultMsg.subtype,
        uuid: resultMsg.uuid,
        sessionId: resultMsg.session_id,
        durationMs: resultMsg.duration_ms,
        isError: resultMsg.is_error,
        numTurns: resultMsg.num_turns,
        totalCostUsd: resultMsg.total_cost_usd,
        usage: resultMsg.usage,
        result: "result" in resultMsg ? resultMsg.result : undefined,
        errors, // Include errors array if present
      };

      console.log("[SDK:handleSDKMessage] Result details:", {
        subtype: resultMsg.subtype,
        isError: resultMsg.is_error,
        result: "result" in resultMsg ? resultMsg.result : undefined,
        errors,
      });

      sendToRenderer("message", eventData);
      processEvents.emit("message", eventData);
      break;
    }

    case "system": {
      const systemMsg = message as SDKSystemMessage;
      const eventData = {
        processId,
        type: "system",
        subtype: systemMsg.subtype,
        uuid: systemMsg.uuid,
        sessionId: systemMsg.session_id,
        cwd: systemMsg.cwd,
        tools: systemMsg.tools,
        model: systemMsg.model,
        permissionMode: systemMsg.permissionMode,
      };
      sendToRenderer("message", eventData);
      processEvents.emit("message", eventData);
      break;
    }

    case "stream_event": {
      const streamMsg = message as SDKPartialAssistantMessage;
      // Handle streaming partial messages for real-time UI updates
      const eventData = {
        processId,
        type: "chunk",
        uuid: streamMsg.uuid,
        sessionId: streamMsg.session_id,
        event: streamMsg.event,
        parentToolUseId: streamMsg.parent_tool_use_id,
        // Extract text content from the stream event for backwards compatibility
        content: extractTextFromStreamEvent(streamMsg.event),
      };
      sendToRenderer("message", eventData);
      processEvents.emit("message", eventData);
      break;
    }

    default:
      console.log("[SDK:handleSDKMessage] Unknown message type:", message);
  }
}

/**
 * Extract text content from Anthropic stream events
 */
function extractTextFromStreamEvent(event: unknown): string {
  if (!event || typeof event !== "object") return "";

  const anyEvent = event as Record<string, unknown>;

  // Handle content_block_delta events (streaming text)
  if (anyEvent.type === "content_block_delta") {
    const delta = anyEvent.delta as Record<string, unknown> | undefined;
    if (delta?.type === "text_delta" && typeof delta.text === "string") {
      return delta.text;
    }
  }

  return "";
}

/**
 * Stop a Claude session
 */
export const stopClaudeSession = os
  .input(z.object({ processId: z.string() }))
  .handler(async ({ input: { processId } }) => {
    const state = activeProcesses.get(processId);

    if (state) {
      console.log("[SDK:stopClaudeSession] Stopping process:", processId);

      state.isActive = false;
      state.abortController.abort();

      // Use interrupt if available
      if (state.query) {
        try {
          await state.query.interrupt();
        } catch (error) {
          console.warn("[SDK:stopClaudeSession] Interrupt failed:", error);
        }
      }

      activeProcesses.delete(processId);
      return { success: true };
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
      input: { projectPath, sessionId, permissionMode, forkSession },
    }) => {
      const processId = generateProcessId();
      const abortController = new AbortController();

      console.log(
        "[SDK:resumeSession] Resuming session:",
        sessionId,
        "for:",
        projectPath
      );

      const state: ProcessState = {
        processId,
        sessionId,
        projectPath, // Store the project path for subsequent messages
        query: null,
        abortController,
        isActive: true,
      };

      activeProcesses.set(processId, state);

      // Send init event
      sendToRenderer("message", {
        processId,
        type: "system",
        subtype: "init",
        content: `Resuming session ${sessionId}...`,
      });

      return { processId, sessionId, resumed: true };
    }
  );

/**
 * Query using SDK (for one-shot queries without maintaining session state)
 */
export const queryOnce = os
  .input(
    z.object({
      prompt: z.string(),
      projectPath: z.string(),
      permissionMode: z.string().optional(),
      maxTurns: z.number().optional(),
    })
  )
  .handler(
    async ({ input: { prompt, projectPath, permissionMode, maxTurns } }) => {
      console.log(
        "[SDK:queryOnce] One-shot query:",
        prompt.slice(0, 50) + "..."
      );

      const processId = generateProcessId();
      const abortController = new AbortController();

      // Get the Claude executable path
      const executablePath = getClaudeExecutablePath();
      if (!executablePath) {
        throw new Error(
          "Claude Code CLI not found. Please install it: npm install -g @anthropic-ai/claude-code"
        );
      }

      // Build environment with proper PATH
      const homeDir = homedir();
      const enhancedEnv = {
        ...process.env,
        PATH: [
          process.env.PATH,
          join(homeDir, ".local", "bin"),
          "/usr/local/bin",
          "/opt/homebrew/bin",
        ]
          .filter(Boolean)
          .join(":"),
        HOME: homeDir,
      };

      try {
        const messages: SDKMessage[] = [];

        const queryResult = sdkQuery({
          prompt,
          options: {
            cwd: projectPath,
            pathToClaudeCodeExecutable: executablePath,
            abortController,
            permissionMode: (permissionMode as PermissionMode) || "default",
            maxTurns: maxTurns || 10,
            model: "claude-sonnet-4-20250514",
            settingSources: ["user", "project"], // Load user settings (auth) and project settings
            env: enhancedEnv,
          },
        });

        for await (const message of queryResult) {
          messages.push(message);
          // Also emit to renderer for real-time updates
          handleSDKMessage(processId, message);
        }

        // Find the result message
        const resultMessage = messages.find(
          (m): m is SDKResultMessage => m.type === "result"
        );

        return {
          processId,
          messages,
          result:
            resultMessage?.subtype === "success" && "result" in resultMessage
              ? resultMessage.result
              : undefined,
          totalCostUsd: resultMessage?.total_cost_usd,
          isError: resultMessage?.is_error,
        };
      } catch (error) {
        console.error("[SDK:queryOnce] Error:", error);
        throw error;
      }
    }
  );
