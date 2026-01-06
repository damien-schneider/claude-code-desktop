// Use SDK-based handlers (primary) with fallback support
import {
  startClaudeSession,
  sendMessage,
  stopClaudeSession,
  getActiveSessions,
  resumeSession,
  getPermissionModes,
  checkClaude,
  queryOnce,
  processEvents,
} from "./sdk-handlers";

// Re-export SDK message types for consumers
export type {
  SDKMessage,
  SDKAssistantMessage,
  SDKUserMessage,
  SDKResultMessage,
  SDKSystemMessage,
  SDKPartialAssistantMessage,
  PermissionMode,
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
