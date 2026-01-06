// Use SDK-based handlers (primary) with fallback support
import {
  checkClaude,
  getActiveSessions,
  getPermissionModes,
  processEvents,
  queryOnce,
  resumeSession,
  sendMessage,
  startClaudeSession,
  stopClaudeSession,
} from "./sdk-handlers";

// Re-export SDK message types for consumers
export type {
  PermissionMode,
  SDKAssistantMessage,
  SDKMessage,
  SDKPartialAssistantMessage,
  SDKResultMessage,
  SDKSystemMessage,
  SDKUserMessage,
} from "./sdk-handlers";

export const claudeProcess = {
  // Core session management
  startClaudeSession,
  sendMessage,
  stopClaudeSession,
  getActiveSessions,
  resumeSession,

  // Configuration
  getPermissionModes,

  // Health check
  checkClaude,

  // One-shot queries
  queryOnce,
};

export { processEvents };
