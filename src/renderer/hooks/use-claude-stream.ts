import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import {
  activeSessionsAtom,
  completionStatusAtom,
  currentSessionIdAtom,
  currentSessionMessagesAtom,
  isStreamingAtom,
  isThinkingAtom,
  lastQueryCostAtom,
  type SessionMessage,
  streamingErrorAtom,
  streamingMessageAtom,
  thinkingStartTimeAtom,
} from "@/renderer/stores";

// =============================================================================
// Types
// =============================================================================

/**
 * Content block types from Claude SDK
 */
interface TextContentBlock {
  type: "text";
  text: string;
}

interface ToolUseContentBlock {
  type: "tool_use";
  name: string;
  input: Record<string, unknown>;
}

interface ToolResultContentBlock {
  type: "tool_result";
  content: string;
}

type ContentBlock =
  | TextContentBlock
  | ToolUseContentBlock
  | ToolResultContentBlock;

/**
 * Message structure from SDK
 */
interface SDKMessageContent {
  role?: string;
  content?: ContentBlock[] | string;
}

/**
 * Stream event structure for partial messages
 */
interface StreamEventDelta {
  type: string;
  text?: string;
}

interface StreamEvent {
  type: string;
  delta?: StreamEventDelta;
}

/**
 * SDK Event data received from main process
 */
interface SDKEventData {
  processId: string;
  type:
    | "chunk"
    | "assistant"
    | "user"
    | "result"
    | "system"
    | "error"
    | "complete"
    | "session_created"
    | "session_ready";
  subtype?: string;
  content?: string;
  message?: SDKMessageContent;
  uuid?: string;
  sessionId?: string;
  event?: StreamEvent;
  result?: string;
  totalCostUsd?: number;
  isError?: boolean;
  errors?: string[];
  code?: number;
  projectName?: string;
  projectPath?: string;
  createdAt?: string;
}

/**
 * IPC message wrapper structure
 */
interface IPCMessageWrapper {
  event: string;
  data: SDKEventData;
}

/**
 * Type guard to validate IPC message structure
 */
function isValidIPCMessage(data: unknown): data is IPCMessageWrapper {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  if (typeof obj.event !== "string") {
    return false;
  }
  if (typeof obj.data !== "object" || obj.data === null) {
    return false;
  }

  const eventData = obj.data as Record<string, unknown>;
  if (typeof eventData.processId !== "string") {
    return false;
  }
  if (typeof eventData.type !== "string") {
    return false;
  }

  return true;
}

/**
 * Extract text content from SDK assistant message
 */
function extractAssistantContent(
  message: SDKMessageContent | undefined
): string {
  if (!message?.content) {
    return "";
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((block): string => {
        switch (block.type) {
          case "text":
            return block.text;
          case "tool_use":
            return `\`\`\`tool_use\n${block.name}\n${JSON.stringify(block.input, null, 2)}\n\`\`\``;
          case "tool_result":
            return `\`\`\`tool_result\n${block.content}\n\`\`\``;
          default:
            return "";
        }
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

/**
 * Hook to handle streaming responses from the Claude SDK process
 *
 * This hook sets up listeners for streaming events from the main process
 * via Electron's IPC system and updates the UI accordingly.
 *
 * Supports both:
 * - Legacy "chunk" events (raw text streaming)
 * - New SDK events (assistant, user, result, system, stream_event)
 */
export const useClaudeStream = (processId: string | null) => {
  const [isStreaming, setIsStreaming] = useAtom(isStreamingAtom);
  const [streamingMessage, setStreamingMessage] = useAtom(streamingMessageAtom);
  const setMessages = useSetAtom(currentSessionMessagesAtom);
  const [currentSessionId, setCurrentSessionId] = useAtom(currentSessionIdAtom);
  const [, setStreamingError] = useAtom(streamingErrorAtom);
  const [, setIsThinking] = useAtom(isThinkingAtom);
  const [, setThinkingStartTime] = useAtom(thinkingStartTimeAtom);
  const [, setCompletionStatus] = useAtom(completionStatusAtom);
  const [, setLastQueryCost] = useAtom(lastQueryCostAtom);
  const [, setActiveSessions] = useAtom(activeSessionsAtom);

  // Use ref to track current streaming content without stale closure issues
  const streamingContentRef = useRef<string>("");
  // Track pending update to debounce rapid consecutive updates
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  const handleSessionCreated = useCallback(
    (eventData: SDKEventData) => {
      console.log("[useClaudeStream] Session created:", eventData);
      setActiveSessions((prev) => {
        const newMap = new Map(prev);
        newMap.set(eventData.processId, {
          processId: eventData.processId,
          sessionId: eventData.sessionId || null,
          projectPath: eventData.projectPath || "",
          projectName: eventData.projectName || "",
          createdAt: eventData.createdAt || new Date().toISOString(),
          isStreaming: true,
        });
        return newMap;
      });
    },
    [setActiveSessions]
  );

  const handleSessionReady = useCallback(
    (eventData: SDKEventData) => {
      console.log("[useClaudeStream] Session ready:", eventData);
      setActiveSessions((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(eventData.processId);
        if (existing) {
          newMap.set(eventData.processId, {
            ...existing,
            sessionId: eventData.sessionId || null,
          });
        }
        return newMap;
      });

      // Update current session ID if this is the active process
      if (eventData.processId === processId) {
        setCurrentSessionId(eventData.sessionId || null);
      }
    },
    [processId, setActiveSessions, setCurrentSessionId]
  );

  const handleChunk = useCallback(
    (eventData: SDKEventData) => {
      const content = eventData.content || "";
      if (content) {
        // We have text content - we're no longer just "thinking"
        setIsThinking(false);
        streamingContentRef.current += content;

        // Update immediately for real-time streaming feel
        if (pendingUpdateRef.current) {
          clearTimeout(pendingUpdateRef.current);
        }
        pendingUpdateRef.current = setTimeout(() => {
          setStreamingMessage(streamingContentRef.current);
          pendingUpdateRef.current = null;
        }, 8);

        setIsStreaming(true);
      }
    },
    [setIsThinking, setStreamingMessage, setIsStreaming]
  );

  const handleAssistant = useCallback(
    (eventData: SDKEventData) => {
      console.log(
        "[useClaudeStream] Assistant message received:",
        eventData.message
      );
      setIsThinking(false);
      const content = extractAssistantContent(eventData.message);
      console.log("[useClaudeStream] Extracted content:", content);
      if (content) {
        // Finalize streaming content first if there is any
        if (streamingContentRef.current) {
          streamingContentRef.current = "";
          setStreamingMessage("");
        }
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content,
            messageId: eventData.uuid || `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: "complete",
          } as SessionMessage,
        ]);
      }
    },
    [setIsThinking, setStreamingMessage, setMessages]
  );

  const handleResult = useCallback(
    (eventData: SDKEventData) => {
      console.log("[useClaudeStream] Result received:", {
        subtype: eventData.subtype,
        isError: eventData.isError,
        result: eventData.result,
        errors: eventData.errors,
      });

      // Clear thinking state
      setIsThinking(false);
      setThinkingStartTime(null);

      // Track cost if available
      if (eventData.totalCostUsd !== undefined) {
        setLastQueryCost(eventData.totalCostUsd);
      }

      // Finalize any remaining streaming content
      if (streamingContentRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: streamingContentRef.current,
            messageId: eventData.uuid || `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: "complete",
          } as SessionMessage,
        ]);
        streamingContentRef.current = "";
        setStreamingMessage("");
      }

      // Handle errors from result
      if (eventData.isError && eventData.errors?.length) {
        const errorText = eventData.errors?.join("\n") || "Unknown error";
        setStreamingError(errorText);
        setCompletionStatus("error");
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            content: `Error: ${errorText}`,
            messageId: `error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: "error",
          } as SessionMessage,
        ]);
      } else if (eventData.subtype === "success") {
        // Successful completion
        setCompletionStatus("success");
        setStreamingError(null);
      }

      setIsStreaming(false);

      // Update active session streaming state
      if (processId) {
        setActiveSessions((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(processId);
          if (existing) {
            newMap.set(processId, { ...existing, isStreaming: false });
          }
          return newMap;
        });
      }
    },
    [
      processId,
      setIsThinking,
      setThinkingStartTime,
      setLastQueryCost,
      setMessages,
      setStreamingMessage,
      setStreamingError,
      setCompletionStatus,
      setIsStreaming,
      setActiveSessions,
    ]
  );

  const handleSystem = useCallback(
    (eventData: SDKEventData) => {
      if (eventData.subtype === "init") {
        // Starting a new query - set thinking state
        setIsStreaming(true);
        setIsThinking(true);
        setThinkingStartTime(Date.now());
        setStreamingError(null);
        setCompletionStatus("idle");
        streamingContentRef.current = "";
        setStreamingMessage("");

        // Update active session streaming state
        if (processId) {
          setActiveSessions((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(processId);
            if (existing) {
              newMap.set(processId, { ...existing, isStreaming: true });
            }
            return newMap;
          });
        }
      }
    },
    [
      processId,
      setIsStreaming,
      setIsThinking,
      setThinkingStartTime,
      setStreamingError,
      setCompletionStatus,
      setStreamingMessage,
      setActiveSessions,
    ]
  );

  const handleComplete = useCallback(
    (eventData: SDKEventData) => {
      setIsThinking(false);
      setThinkingStartTime(null);

      // Finalize any remaining streaming content
      if (streamingContentRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: streamingContentRef.current,
            messageId: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: "complete",
          } as SessionMessage,
        ]);
        streamingContentRef.current = "";
        setStreamingMessage("");
      }
      setIsStreaming(false);

      // If code is non-zero, mark as partial/error completion
      const code = eventData.code as number | undefined;
      if (code && code !== 0) {
        setCompletionStatus("partial");
      }
    },
    [
      setIsThinking,
      setThinkingStartTime,
      setMessages,
      setStreamingMessage,
      setIsStreaming,
      setCompletionStatus,
    ]
  );

  const handleError = useCallback(
    (eventData: SDKEventData) => {
      const errorContent = eventData.content || "Unknown error";
      console.error("[useClaudeStream] Claude process error:", errorContent);
      setIsStreaming(false);
      setIsThinking(false);
      setThinkingStartTime(null);
      setStreamingError(errorContent);
      setCompletionStatus("error");
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          content: `Error: ${errorContent}`,
          messageId: `error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: "error",
        } as SessionMessage,
      ]);
    },
    [
      setIsStreaming,
      setIsThinking,
      setThinkingStartTime,
      setStreamingError,
      setCompletionStatus,
      setMessages,
    ]
  );

  const handleMessage = useCallback(
    (_event: unknown, data: IPCMessageWrapper) => {
      const eventData = data.data;
      if (eventData.processId !== processId) {
        return;
      }

      // Update current session ID if not set (for new sessions)
      if (!currentSessionId && eventData.sessionId) {
        setCurrentSessionId(eventData.sessionId);
      }

      switch (eventData.type) {
        // Session created event
        case "session_created": {
          handleSessionCreated(eventData);
          break;
        }

        // Session ready event (when we have the session ID)
        case "session_ready": {
          handleSessionReady(eventData);
          break;
        }

        // Legacy chunk events (for backwards compatibility)
        case "chunk": {
          handleChunk(eventData);
          break;
        }

        // SDK assistant message (complete message with content blocks)
        case "assistant": {
          handleAssistant(eventData);
          break;
        }

        // SDK user message (echoed back from SDK)
        case "user": {
          // User messages are already added locally, skip echo
          break;
        }

        // SDK result message (session complete)
        case "result": {
          handleResult(eventData);
          break;
        }

        // SDK system message (init, etc.)
        case "system": {
          handleSystem(eventData);
          break;
        }

        // Process complete
        case "complete": {
          handleComplete(eventData);
          break;
        }

        // Error handling
        case "error": {
          handleError(eventData);
          break;
        }

        default: {
          console.warn(
            `[useClaudeStream] Unhandled event type: ${eventData.type}`
          );
          break;
        }
      }
    },
    [
      processId,
      handleSessionCreated,
      handleSessionReady,
      handleChunk,
      handleAssistant,
      handleResult,
      handleSystem,
      handleComplete,
      handleError,
      currentSessionId,
      setCurrentSessionId,
    ]
  );

  useEffect(() => {
    if (!processId) {
      return;
    }

    // Reset streaming state when processId changes
    streamingContentRef.current = "";
    setStreamingMessage("");

    // Wrapper that validates the IPC message structure
    // Note: preload strips the IPC event, so we receive just the data directly
    const messageHandler = (...args: unknown[]): void => {
      // The preload sends (...args) where args[0] is the actual message payload
      // Structure: { event: string, data: SDKEventData }
      const payload = args[0];

      console.log("[useClaudeStream] Received IPC payload:", payload);

      if (isValidIPCMessage(payload)) {
        handleMessage(null, payload);
      } else {
        console.warn(
          "[useClaudeStream] Received invalid IPC message:",
          payload
        );
      }
    };

    // Register the event listener with Electron's IPC renderer
    if (window.electron?.on) {
      console.log(
        "[useClaudeStream] Registering listener for processId:",
        processId
      );
      window.electron.on("claude-process-event", messageHandler);
    }

    // Cleanup listener on unmount or processId change
    return () => {
      // Cancel any pending update
      if (pendingUpdateRef.current !== null) {
        clearTimeout(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }

      // Remove active session tracking
      if (processId) {
        setActiveSessions((prev) => {
          const newMap = new Map(prev);
          newMap.delete(processId);
          return newMap;
        });
      }

      if (window.electron?.removeListener) {
        console.log(
          "[useClaudeStream] Removing listener for processId:",
          processId
        );
        window.electron.removeListener("claude-process-event", messageHandler);
      }
    };
  }, [processId, handleMessage, setStreamingMessage, setActiveSessions]);

  return { isStreaming, streamingMessage };
};
