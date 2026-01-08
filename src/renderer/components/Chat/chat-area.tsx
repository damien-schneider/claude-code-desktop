import {
  ChatCircle,
  CheckCircle,
  Code,
  Lock,
  Play,
  Spinner,
  StopCircle,
  WarningCircle,
  X,
  XCircle,
} from "@phosphor-icons/react";
import type { FileUIPart } from "ai";
import { useAtom, useSetAtom } from "jotai";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { ToolResultDisplay } from "@/components/ai-elements/tool-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClaudeStream } from "@/renderer/hooks/use-claude-stream";
import {
  activeProcessIdAtom,
  activeSessionsAtom,
  currentSessionIdAtom,
  currentSessionMessagesAtom,
  formatMessageContent,
  isStreamingAtom,
  isThinkingAtom,
  lastQueryCostAtom,
  type PermissionMode,
  resumeSessionAtom,
  type SessionMessage,
  sendMessageAtom,
  sessionsAtom,
  stopSessionAtom,
  streamingErrorAtom,
  streamingMessageAtom,
} from "@/renderer/stores/chat-atoms";
import { cn } from "@/utils/tailwind";
import { PermissionModeSelector } from "./permission-mode-selector";
import { ThinkingIndicator } from "./thinking-indicator";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex chat UI with message handling - refactoring would require extracting message components
export const ChatArea: React.FC = () => {
  const [messages] = useAtom(currentSessionMessagesAtom);
  const [isStreaming] = useAtom(isStreamingAtom);
  const [streamingMessage] = useAtom(streamingMessageAtom);
  const [activeProcessId] = useAtom(activeProcessIdAtom);
  const [currentSessionId] = useAtom(currentSessionIdAtom);
  const [sessions] = useAtom(sessionsAtom);
  const [activeSessions] = useAtom(activeSessionsAtom);
  const [streamingError] = useAtom(streamingErrorAtom);
  const [isThinking] = useAtom(isThinkingAtom);
  const [lastQueryCost] = useAtom(lastQueryCostAtom);
  const sendMessage = useSetAtom(sendMessageAtom);
  const stopSession = useSetAtom(stopSessionAtom);
  const resumeSession = useSetAtom(resumeSessionAtom);

  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine placeholder text based on current state
  const getPlaceholderText = () => {
    if (isStreaming || isThinking) {
      return "Waiting for response...";
    }
    if (activeProcessId) {
      return "Send a message... (Enter to send, Shift+Enter for new line)";
    }
    return "Start a new session... (Enter to send, Shift+Enter for new line)";
  };

  // Set up streaming listener for active process
  useClaudeStream(activeProcessId);

  // Local state for resume options
  const [permissionMode, setPermissionMode] =
    useState<PermissionMode>("default");
  const [isResuming, setIsResuming] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Get current session info
  const currentSession = currentSessionId
    ? sessions.find((s) => s.sessionId === currentSessionId)
    : null;

  // Check if current session is active elsewhere (in activeSessions but not our activeProcessId)
  const isSessionActiveElsewhere = currentSessionId
    ? Array.from(activeSessions.values()).some(
        (s) =>
          s.sessionId === currentSessionId && s.processId !== activeProcessId
      )
    : false;

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = async (
    { text }: { text: string; files: FileUIPart[] },
    e: React.FormEvent
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex form submission with file handling - refactoring would require extracting file upload logic
  ) => {
    e.preventDefault();
    if (!text.trim() || isStreaming || isSending) {
      return;
    }

    // If no active process but we have a session, try to resume it first
    if (!activeProcessId && currentSessionId && currentSession) {
      setIsResuming(true);
      try {
        await resumeSession({
          sessionId: currentSessionId,
          projectPath: currentSession.projectPath,
          permissionMode,
        });
        // After successful resume, send the message
        setIsSending(true);
        try {
          setSendError(null);
          await sendMessage(text);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Failed to send message:", error);
          setSendError(errorMessage);
        } finally {
          setIsSending(false);
        }
      } catch (error) {
        console.error("Failed to resume session:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setSendError(errorMessage);
      } finally {
        setIsResuming(false);
      }
      return;
    }

    setIsSending(true);
    try {
      setSendError(null);
      await sendMessage(text);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to send message:", error);
      setSendError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleResumeSession = async () => {
    if (!(currentSessionId && currentSession)) {
      return;
    }

    setIsResuming(true);
    try {
      await resumeSession({
        sessionId: currentSessionId,
        projectPath: currentSession.projectPath,
        permissionMode,
      });
    } catch (error) {
      console.error("Failed to resume session:", error);
    } finally {
      setIsResuming(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopSession();
    } catch (error) {
      console.error("Failed to stop session:", error);
    }
  };

  // Render a single message
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex message rendering with multiple content types and tool blocks - refactoring would require extracting message type handlers
  const renderMessage = (msg: SessionMessage, index: number) => {
    const isUser = msg.type === "user";
    const isSystem = msg.type === "system";
    const isError = msg.status === "error";

    // Skip rendering if this is a duplicate system message (same type and status as previous)
    if (isSystem && index > 0) {
      const prevMsg = messages[index - 1];
      if (
        prevMsg.type === "system" &&
        prevMsg.status === msg.status &&
        prevMsg.content === msg.content
      ) {
        return null;
      }
    }

    // Get content - check if it's an array (content blocks) or needs formatting
    const content = msg.content || msg.message?.content;
    const contentBlocks = Array.isArray(content) ? content : undefined;

    // Check if this is a user message that ONLY contains tool_result blocks
    // These should be rendered directly without Message wrapper
    const isToolResultOnly =
      isUser &&
      contentBlocks &&
      contentBlocks.length > 0 &&
      contentBlocks.every(
        (block: { type?: string }) => block.type === "tool_result"
      );

    // If it's only tool results, render them directly without Message wrapper
    if (isToolResultOnly) {
      return (
        <div className="flex flex-col gap-2" key={msg.messageId || index}>
          {contentBlocks.map(
            (
              block: {
                type: string;
                content?: string | unknown[];
                is_error?: boolean;
                tool_use_id?: string;
              },
              blockIndex: number
            ) => {
              const resultContent =
                typeof block.content === "string"
                  ? block.content
                  : JSON.stringify(block.content);
              return (
                <ToolResultDisplay
                  content={resultContent}
                  isError={block.is_error}
                  key={block.tool_use_id || blockIndex}
                />
              );
            }
          )}
        </div>
      );
    }

    // Check if user message contains mixed tool blocks
    const hasToolBlocks = contentBlocks?.some(
      (block: { type?: string }) =>
        block.type === "tool_result" || block.type === "tool_use"
    );

    const contentString = contentBlocks
      ? undefined
      : formatMessageContent(content || "");

    // System messages (errors, info)
    if (isSystem) {
      return (
        <div
          className={cn(
            "mx-auto flex max-w-[90%] items-start gap-2 rounded-md px-3 py-2 text-xs",
            isError
              ? "border border-destructive/20 bg-destructive/10 text-destructive"
              : "bg-muted/50 text-muted-foreground"
          )}
          key={msg.messageId || index}
        >
          {isError ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="break-words">
            {formatMessageContent(content || "")}
          </span>
        </div>
      );
    }

    return (
      <Message
        from={isUser ? "user" : "assistant"}
        key={msg.messageId || index}
      >
        <MessageContent>
          {isUser && !hasToolBlocks ? (
            formatMessageContent(content || "")
          ) : (
            <MessageResponse contentBlocks={contentBlocks}>
              {contentString}
            </MessageResponse>
          )}
        </MessageContent>
      </Message>
    );
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Debug Panel Toggle */}
      <Button
        className="absolute top-2 right-2 z-50 size-8 p-0"
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        title="Toggle Debug Panel"
        variant="ghost"
      >
        <Code className="size-4" />
      </Button>

      {/* Debug Panel - Raw conversation data */}
      {showDebugPanel && (
        <div className="absolute top-12 right-2 z-50 max-h-[80vh] w-[50vw] overflow-auto rounded-lg border bg-background/95 p-4 shadow-xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Raw Conversation Data</h3>
            <Button
              className="size-6 p-0"
              onClick={() => setShowDebugPanel(false)}
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="mb-1 font-medium text-muted-foreground text-xs">
                Messages ({messages.length})
              </h4>
              <pre className="max-h-[60vh] overflow-auto rounded bg-muted p-2 font-mono text-xs">
                {JSON.stringify(messages, null, 2)}
              </pre>
            </div>
            {streamingMessage && (
              <div>
                <h4 className="mb-1 font-medium text-muted-foreground text-xs">
                  Streaming Message
                </h4>
                <pre className="max-h-40 overflow-auto rounded bg-muted p-2 font-mono text-xs">
                  {streamingMessage}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && !isStreaming && !isThinking ? (
            <ConversationEmptyState
              description="View conversation history from your Claude Code sessions"
              icon={<ChatCircle className="h-16 w-16 opacity-20" />}
              title="No messages in this session"
            />
          ) : (
            <>
              {messages
                .map((msg, index) => renderMessage(msg, index))
                .filter(Boolean)}

              {/* Thinking indicator - shows when Claude is processing */}
              {isThinking && !streamingMessage && (
                <Message from="assistant">
                  <MessageContent>
                    <ThinkingIndicator />
                  </MessageContent>
                </Message>
              )}

              {/* Streaming message - shows as text comes in */}
              {streamingMessage && (
                <Message from="assistant">
                  <MessageContent>
                    <MessageResponse>{streamingMessage}</MessageResponse>
                  </MessageContent>
                </Message>
              )}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </>
          )}
        </ConversationContent>
      </Conversation>

      {/* Streaming Error Alert */}
      {streamingError && (
        <div className="px-4 py-2">
          <Alert variant="destructive">
            <WarningCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {streamingError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-background p-4">
        {sendError && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm">
            <WarningCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <div className="font-medium text-destructive">
                Failed to send message
              </div>
              <div className="mt-1 text-destructive/80">{sendError}</div>
            </div>
            <button
              className="text-destructive/60 hover:text-destructive"
              onClick={() => setSendError(null)}
              type="button"
            >
              ×
            </button>
          </div>
        )}

        {/* Permission Mode Selector - always visible at top of input area */}
        <PermissionModeSelector
          disabled={!!activeProcessId || isResuming}
          onChange={setPermissionMode}
          value={permissionMode}
        />

        {isSessionActiveElsewhere ? (
          // Session is active elsewhere - show resume button with disabled input
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3 text-muted-foreground text-sm">
              <Lock className="h-4 w-4" />
              <span>
                This session is running elsewhere. Resume to take control.
              </span>
            </div>
            <Button
              className="w-full gap-2"
              disabled={isResuming}
              onClick={handleResumeSession}
              size="lg"
            >
              {isResuming ? (
                <>
                  <Spinner className="h-4 w-4 animate-spin" />
                  Resuming session...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Resume Session
                </>
              )}
            </Button>
          </div>
        ) : null}

        {!isSessionActiveElsewhere && (currentSessionId || activeProcessId) && (
          // Session selected or active - show chat interface
          <PromptInput onSubmit={handleSubmit}>
            <div className="pointer-events-none absolute -top-6 left-0 flex select-none items-center gap-2 px-1">
              {activeProcessId && isStreaming && (
                <div className="flex items-center gap-2">
                  <Spinner className="h-3 w-3 animate-spin text-primary" />
                  <span className="animate-pulse font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                    Claude is responding...
                  </span>
                </div>
              )}
              {activeProcessId && isThinking && !isStreaming && (
                <div className="flex items-center gap-2">
                  <Spinner className="h-3 w-3 animate-spin text-primary" />
                  <span className="animate-pulse font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                    Claude is thinking...
                  </span>
                </div>
              )}
              {activeProcessId && !isStreaming && !isThinking && (
                <div className="flex items-center gap-2">
                  <div className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="font-medium text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                    Claude Code active
                  </span>
                </div>
              )}
            </div>
            {lastQueryCost !== null && !isStreaming && !isThinking && (
              <Badge
                className="absolute top-2 right-2 z-10 bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover/input-group:opacity-100"
                variant="outline"
              >
                Last query cost: ${lastQueryCost.toFixed(4)}
              </Badge>
            )}
            <PromptInputTextarea
              disabled={isStreaming || isThinking || isSending}
              placeholder={getPlaceholderText()}
            />
            <div className="flex items-center justify-end gap-2 p-2">
              {isStreaming || isThinking ? (
                <Button
                  className="gap-2"
                  onClick={handleStop}
                  size="sm"
                  variant="destructive"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop
                </Button>
              ) : (
                <PromptInputSubmit disabled={isSending}>
                  {isSending && (
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                </PromptInputSubmit>
              )}
            </div>
          </PromptInput>
        )}

        {!(isSessionActiveElsewhere || currentSessionId || activeProcessId) && (
          // No session selected
          <div className="py-8 text-center text-muted-foreground text-sm">
            <ChatCircle className="mx-auto mb-2 h-12 w-12 opacity-20" />
            Select a session from the sidebar to view or start a new session
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
