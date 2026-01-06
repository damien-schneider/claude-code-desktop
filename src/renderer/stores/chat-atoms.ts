import { atom } from "jotai";
import { z } from "zod";
import { selectedProjectIdAtom } from "./atoms";

// =============================================================================
// Permission Modes
// =============================================================================

/**
 * Permission modes for Claude Code CLI
 * Dynamically fetched from the CLI to support all available modes
 * Reference: https://github.com/anthropics/claude-code/issues/6227
 *
 * Known modes:
 * - default: Ask for tool permissions (normal mode)
 * - plan: Read-only planning mode
 * - acceptEdits: Auto-accept edit permissions
 * - bypassPermissions: Skip all permission checks (use with caution!)
 * - delegate: Delegate mode for subagents
 * - dontAsk: Don't ask for permissions
 */
export type PermissionMode = string;

export interface ResumeSessionOptions {
  sessionId: string;
  projectPath: string;
  permissionMode?: PermissionMode;
  agentName?: string;
  forkSession?: boolean;
}

// =============================================================================
// Zod Schemas for Type Safety
// =============================================================================

// Content block types
const TextContentBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ImageContentBlockSchema = z.object({
  type: z.literal("image"),
  source: z
    .object({
      type: z.string(),
      media_type: z.string().optional(),
      data: z.string().optional(),
    })
    .optional(),
});

const ToolUseContentBlockSchema = z.object({
  type: z.literal("tool_use"),
  id: z.string().optional(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
});

const ToolResultContentBlockSchema = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string().optional(),
  content: z.union([z.string(), z.array(z.unknown())]),
  is_error: z.boolean().optional(),
});

const ContentBlockSchema = z.union([
  TextContentBlockSchema,
  ImageContentBlockSchema,
  ToolUseContentBlockSchema,
  ToolResultContentBlockSchema,
]);

export const SessionMessageContentSchema = z.union([
  z.string(),
  z.array(ContentBlockSchema),
  z.object({
    role: z.string(),
    content: z.union([z.string(), z.array(ContentBlockSchema)]),
  }),
]);

// Tool call schema for tracking tool usage
const ToolCallSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
  result: z.string().optional(),
  isError: z.boolean().optional(),
});

export const SessionMessageSchema = z.object({
  type: z.enum(["user", "assistant", "system"]),
  messageId: z.string().optional(),
  timestamp: z.string(),
  content: SessionMessageContentSchema.optional(),
  message: z
    .object({
      role: z.string().optional(),
      content: z.union([z.string(), z.array(ContentBlockSchema)]).optional(),
    })
    .optional(),
  toolCalls: z.array(ToolCallSchema).optional(),
  status: z.enum(["pending", "streaming", "complete", "error"]).optional(),
});

export const SessionSummarySchema = z.object({
  sessionId: z.string(),
  projectPath: z.string(),
  projectName: z.string(),
  createdAt: z.string(),
  lastMessageAt: z.string(),
  messageCount: z.number(),
  gitBranch: z.string().optional(),
  previewMessage: z.string().optional(),
});

// =============================================================================
// TypeScript Types (inferred from Zod schemas)
// =============================================================================

export interface SessionSummary {
  sessionId: string;
  projectPath: string;
  projectName: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  gitBranch?: string;
  previewMessage?: string;
}

// Content block types
export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface ImageContentBlock {
  type: "image";
  source?: {
    type: string;
    media_type?: string;
    data?: string;
  };
}

export interface ToolUseContentBlock {
  type: "tool_use";
  id?: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContentBlock {
  type: "tool_result";
  tool_use_id?: string;
  content: string | unknown[];
  is_error?: boolean;
}

export type ContentBlock =
  | TextContentBlock
  | ImageContentBlock
  | ToolUseContentBlock
  | ToolResultContentBlock;

export type SessionMessageContent = z.infer<typeof SessionMessageContentSchema>;

export interface ToolCall {
  id?: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
}

export interface SessionMessage {
  type: "user" | "assistant" | "system";
  messageId?: string;
  timestamp: string;
  content?: SessionMessageContent;
  message?: {
    role?: string;
    content?: string | ContentBlock[];
  };
  toolCalls?: ToolCall[];
  status?: "pending" | "streaming" | "complete" | "error";
}

// =============================================================================
// Helper Functions to Safely Extract Content
// =============================================================================

/**
 * Type guard for TextContentBlock
 */
function isTextContentBlock(block: ContentBlock): block is TextContentBlock {
  return block.type === "text";
}

/**
 * Type guard for ToolUseContentBlock
 */
function isToolUseContentBlock(
  block: ContentBlock
): block is ToolUseContentBlock {
  return block.type === "tool_use";
}

/**
 * Type guard for ToolResultContentBlock
 */
function isToolResultContentBlock(
  block: ContentBlock
): block is ToolResultContentBlock {
  return block.type === "tool_result";
}

/**
 * Type guard for content that is an object with a role property
 */
function isRoleContent(
  content: unknown
): content is { role: string; content: string | ContentBlock[] } {
  return (
    typeof content === "object" &&
    content !== null &&
    "role" in content &&
    typeof (content as Record<string, unknown>).role === "string"
  );
}

/**
 * Safely converts message content to a displayable string
 * Handles string, array of content blocks, or object formats
 */
export function formatMessageContent(
  content: SessionMessageContent | undefined
): string {
  if (!content) {
    return "";
  }

  // If content is already a string
  if (typeof content === "string") {
    return content;
  }

  // If content is an array (content blocks)
  if (Array.isArray(content)) {
    return content
      .map((block): string => {
        if (isTextContentBlock(block)) {
          return block.text;
        }
        if (isToolUseContentBlock(block)) {
          return `\`\`\`tool_use\n${block.name}\n${JSON.stringify(block.input, null, 2)}\n\`\`\``;
        }
        if (isToolResultContentBlock(block)) {
          const resultContent =
            typeof block.content === "string"
              ? block.content
              : JSON.stringify(block.content);
          return `\`\`\`tool_result\n${resultContent}\n\`\`\``;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  // If content is an object with role (nested message format)
  if (isRoleContent(content)) {
    const nestedContent = content.content;
    if (typeof nestedContent === "string") {
      return nestedContent;
    }
    if (Array.isArray(nestedContent)) {
      return formatMessageContent(nestedContent);
    }
    return "";
  }

  // Fallback: stringify the object
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

// =============================================================================
// Session List State
// =============================================================================

export const sessionsAtom = atom<SessionSummary[]>([]);

export const sessionsLoadingAtom = atom<boolean>(false);

export const sessionsErrorAtom = atom<string | null>(null);

// =============================================================================
// Active Sessions (real-time, not yet persisted)
// =============================================================================

/**
 * Interface for tracking active sessions that may not be persisted yet
 */
export interface ActiveSession {
  processId: string;
  sessionId: string | null;
  projectPath: string;
  projectName: string;
  createdAt: string;
  isStreaming: boolean;
  previewMessage?: string;
}

/**
 * Atom tracking all active sessions by process ID
 * These are sessions that have been started but may not be persisted to disk yet
 */
export const activeSessionsAtom = atom<Map<string, ActiveSession>>(new Map());

/**
 * Derived atom that combines persisted sessions with active sessions
 * Ensures no duplicates by sessionId when both exist
 */
export const allSessionsAtom = atom<SessionSummary[]>((get) => {
  const persistedSessions = get(sessionsAtom);
  const activeSessions = get(activeSessionsAtom);

  // Convert active sessions to SessionSummary format
  const activeSessionSummaries: SessionSummary[] = Array.from(
    activeSessions.values()
  )
    .filter(
      (active): active is typeof active & { sessionId: string } =>
        active.sessionId !== null
    ) // Only include sessions with IDs
    .map((active) => ({
      sessionId: active.sessionId,
      projectPath: active.projectPath,
      projectName: active.projectName,
      createdAt: active.createdAt,
      lastMessageAt: active.createdAt, // Use creation time for now
      messageCount: 0, // Will be updated when persisted
      previewMessage: active.previewMessage,
    }));

  // Merge: use persisted data when available, otherwise use active session data
  const persistedSessionIds = new Set(
    persistedSessions.map((s) => s.sessionId)
  );
  const newActiveSessions = activeSessionSummaries.filter(
    (s) => !persistedSessionIds.has(s.sessionId)
  );

  return [...persistedSessions, ...newActiveSessions];
});

/**
 * Helper atom to check if a session is currently streaming
 */
export const isSessionStreamingAtom = atom((get) => (sessionId: string) => {
  const activeSessions = get(activeSessionsAtom);
  return Array.from(activeSessions.values()).some(
    (s) => s.sessionId === sessionId && s.isStreaming
  );
});

// =============================================================================
// Session Filtering
// =============================================================================

export type SessionFilter = "all" | "project";

export const sessionFilterAtom = atom<SessionFilter>("all");

export const selectedProjectForSessionsAtom = atom<string | null>(null);

export const sessionSearchQueryAtom = atom<string>("");

// =============================================================================
// Current Session State
// =============================================================================

export const currentSessionIdAtom = atom<string | null>(null);

export const currentSessionMessagesAtom = atom<SessionMessage[]>([]);

export const currentSessionLoadingAtom = atom<boolean>(false);

// =============================================================================
// Active Chat Process State
// =============================================================================

export const activeProcessIdAtom = atom<string | null>(null);

export const isStreamingAtom = atom<boolean>(false);

export const streamingMessageAtom = atom<string>("");

/**
 * Error state for streaming - displays error messages in UI
 */
export const streamingErrorAtom = atom<string | null>(null);

/**
 * Whether Claude is currently "thinking" (processing before streaming text)
 */
export const isThinkingAtom = atom<boolean>(false);

/**
 * Timestamp when thinking started (for duration display)
 */
export const thinkingStartTimeAtom = atom<number | null>(null);

/**
 * Session completion status - tracks if the last response completed successfully
 */
export type CompletionStatus = "idle" | "success" | "error" | "partial";
export const completionStatusAtom = atom<CompletionStatus>("idle");

/**
 * Total cost from the last query (if available)
 */
export const lastQueryCostAtom = atom<number | null>(null);

// =============================================================================
// Claude Availability State
// =============================================================================

export interface ClaudeAvailability {
  available: boolean;
  version?: string;
  error?: string;
  checked: boolean;
}

export const claudeAvailabilityAtom = atom<ClaudeAvailability>({
  available: false,
  checked: false,
});

export const checkClaudeAvailabilityAtom = atom(null, async (_get, set) => {
  try {
    const { ipc } = await import("@/ipc/manager");
    const result = await ipc.client.claudeProcess.checkClaude();
    set(claudeAvailabilityAtom, {
      ...result,
      checked: true,
    });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    set(claudeAvailabilityAtom, {
      available: false,
      error: errorMessage,
      checked: true,
    });
    return { available: false, error: errorMessage };
  }
});

// =============================================================================
// Computed: Filtered Sessions
// =============================================================================

/**
 * Derived atom that returns sessions filtered by search query and project
 * Now includes both persisted and active sessions
 */
export const filteredSessionsAtom = atom<SessionSummary[]>((get) => {
  const sessions = get(allSessionsAtom);
  const filter = get(sessionFilterAtom);
  const activeSessions = get(activeSessionsAtom);
  const selectedProject =
    get(selectedProjectForSessionsAtom) || get(selectedProjectIdAtom);
  const searchQuery = get(sessionSearchQueryAtom);

  let filtered = sessions;

  // Filter by project
  if (filter === "project" && selectedProject) {
    filtered = filtered.filter((s) => s.projectPath === selectedProject);
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.projectName.toLowerCase().includes(query) ||
        s.previewMessage?.toLowerCase().includes(query)
    );
  }

  // Sort: streaming sessions first, then by date
  return filtered.sort((a, b) => {
    const aStreaming = Array.from(activeSessions.values()).some(
      (s) => s.sessionId === a.sessionId && s.isStreaming
    );
    const bStreaming = Array.from(activeSessions.values()).some(
      (s) => s.sessionId === b.sessionId && s.isStreaming
    );

    if (aStreaming && !bStreaming) {
      return -1;
    }
    if (!aStreaming && bStreaming) {
      return 1;
    }

    return (
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  });
});

// =============================================================================
// Actions
// =============================================================================

/**
 * Load all sessions from ~/.claude/projects/
 * Uses history.jsonl as the source of truth for project paths
 */
export const loadSessionsAtom = atom(null, async (_get, set) => {
  set(sessionsLoadingAtom, true);
  set(sessionsErrorAtom, null);

  try {
    const { ipc } = await import("@/ipc/manager");

    // Use getAllSessions which reads from history.jsonl (the correct source)
    const allSessions = await ipc.client.sessions.getAllSessions();

    set(sessionsAtom, allSessions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    set(sessionsErrorAtom, errorMessage);
    console.error("[loadSessionsAtom] Failed to load sessions:", error);
  } finally {
    set(sessionsLoadingAtom, false);
  }
});

/**
 * Load session details (messages) for a specific session
 */
export const loadSessionDetailsAtom = atom(
  null,
  async (get, set, sessionId: string) => {
    set(currentSessionLoadingAtom, true);

    try {
      const { ipc } = await import("@/ipc/manager");
      const sessions = get(sessionsAtom);
      const session = sessions.find((s) => s.sessionId === sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      const details = await ipc.client.sessions.getSessionDetails({
        sessionId,
        projectPath: session.projectPath,
      });

      // Normalize messages to our format with proper type handling
      const normalizedMessages: SessionMessage[] = details.messages.map(
        (msg: Record<string, unknown>) => normalizeSessionMessage(msg)
      );

      set(currentSessionIdAtom, sessionId);
      set(currentSessionMessagesAtom, normalizedMessages);
    } catch (error) {
      console.error(
        "[loadSessionDetailsAtom] Failed to load session details:",
        error
      );
      throw error;
    } finally {
      set(currentSessionLoadingAtom, false);
    }
  }
);

/**
 * Start a new chat session using the Claude SDK
 * First checks if Claude is available before starting
 */
export const startNewSessionAtom = atom(
  null,
  async (_get, set, projectPath: string, initialMessage?: string) => {
    try {
      const { ipc } = await import("@/ipc/manager");

      // Check if Claude is available first
      const claudeStatus = await ipc.client.claudeProcess.checkClaude();
      if (!claudeStatus.available) {
        throw new Error(
          claudeStatus.error || "Claude Code CLI is not available"
        );
      }

      // Reset state before starting new session
      set(currentSessionMessagesAtom, []);
      set(streamingMessageAtom, "");
      set(streamingErrorAtom, null);

      const result = await ipc.client.claudeProcess.startClaudeSession({
        projectPath,
        continueLast: false,
        initialMessage,
      });

      set(activeProcessIdAtom, result.processId);
      set(currentSessionIdAtom, result.sessionId || null);

      return result;
    } catch (error) {
      console.error("[startNewSessionAtom] Failed to start session:", error);
      throw error;
    }
  }
);

/**
 * Send a message to the active claude process
 */
export const sendMessageAtom = atom(
  null,
  async (get, set, message: string, projectPath?: string) => {
    const processId = get(activeProcessIdAtom);
    if (!processId) {
      throw new Error("No active session");
    }

    try {
      const { ipc } = await import("@/ipc/manager");
      await ipc.client.claudeProcess.sendMessage({
        processId,
        message,
        projectPath,
      });

      // Add user message to local state
      const messages = get(currentSessionMessagesAtom);
      set(currentSessionMessagesAtom, [
        ...messages,
        {
          type: "user",
          messageId: `msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          content: message,
          status: "complete",
        },
      ]);

      set(isStreamingAtom, true);
    } catch (error) {
      console.error("[sendMessageAtom] Failed to send message:", error);
      throw error;
    }
  }
);

/**
 * Stop the active claude session
 */
export const stopSessionAtom = atom(null, async (get, set) => {
  const processId = get(activeProcessIdAtom);
  if (!processId) {
    return;
  }

  try {
    const { ipc } = await import("@/ipc/manager");
    await ipc.client.claudeProcess.stopClaudeSession({ processId });

    set(activeProcessIdAtom, null);
    set(isStreamingAtom, false);
    set(streamingMessageAtom, "");
  } catch (error) {
    console.error("[stopSessionAtom] Failed to stop session:", error);
    throw error;
  }
});

/**
 * Resume an existing session
 * Uses --resume flag to load a previous session by ID
 */
export const resumeSessionAtom = atom(
  null,
  async (_get, set, options: ResumeSessionOptions) => {
    try {
      const { ipc } = await import("@/ipc/manager");
      const result = await ipc.client.claudeProcess.resumeSession({
        projectPath: options.projectPath,
        sessionId: options.sessionId,
        permissionMode: options.permissionMode,
        agentName: options.agentName,
        forkSession: options.forkSession,
      });

      set(activeProcessIdAtom, result.processId);
      set(currentSessionIdAtom, options.sessionId);

      // Reload session details to get the latest messages
      await set(loadSessionDetailsAtom, options.sessionId);

      return result;
    } catch (error) {
      console.error("[resumeSessionAtom] Failed to resume session:", error);
      throw error;
    }
  }
);

/**
 * Normalizes messages from the sessions IPC to our SessionMessage format
 */
const normalizeSessionMessage = (
  msg: Record<string, unknown>
): SessionMessage => {
  // Determine message type
  let messageType: "user" | "assistant" | "system" = "assistant";
  if (
    typeof msg.type === "string" &&
    (msg.type === "user" || msg.type === "assistant" || msg.type === "system")
  ) {
    messageType = msg.type as "user" | "assistant" | "system";
  } else if (
    typeof msg.message === "object" &&
    msg.message !== null &&
    "role" in msg.message
  ) {
    const role = (msg.message as Record<string, unknown>).role;
    messageType = role === "user" ? "user" : "assistant";
  }

  // Extract content safely
  let content: SessionMessageContent | undefined;
  if (typeof msg.content === "string") {
    content = msg.content;
  } else if (Array.isArray(msg.content)) {
    content = msg.content as ContentBlock[];
  } else if (
    typeof msg.message === "object" &&
    msg.message !== null &&
    "content" in msg.message
  ) {
    const msgContent = (msg.message as Record<string, unknown>).content;
    if (typeof msgContent === "string") {
      content = msgContent;
    } else if (Array.isArray(msgContent)) {
      content = msgContent as ContentBlock[];
    }
  }

  return {
    type: messageType,
    messageId: typeof msg.messageId === "string" ? msg.messageId : undefined,
    timestamp:
      typeof msg.timestamp === "string"
        ? msg.timestamp
        : new Date().toISOString(),
    content,
    status: "complete",
  };
};
