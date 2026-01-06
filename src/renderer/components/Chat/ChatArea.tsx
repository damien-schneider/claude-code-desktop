import { useRef, useEffect, useState } from "react";
import type React from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  StopCircle,
  Play,
  Spinner,
  WarningCircle,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import {
  currentSessionMessagesAtom,
  isStreamingAtom,
  streamingMessageAtom,
  activeProcessIdAtom,
  sendMessageAtom,
  stopSessionAtom,
  resumeSessionAtom,
  currentSessionIdAtom,
  sessionsAtom,
  formatMessageContent,
  streamingErrorAtom,
  isThinkingAtom,
  lastQueryCostAtom,
  type SessionMessage,
  type PermissionMode,
} from "@/renderer/stores/chatAtoms";
import { useClaudeStream } from "@/renderer/hooks/useClaudeStream";
import { ThinkingIndicator } from "./ThinkingIndicator";
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
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatCircle } from "@phosphor-icons/react";
import { PermissionModeSelector } from "./PermissionModeSelector";
import { cn } from "@/utils/tailwind";
import type { FileUIPart } from "ai";

export const ChatArea: React.FC = () => {
  const [messages] = useAtom(currentSessionMessagesAtom);
  const [isStreaming] = useAtom(isStreamingAtom);
  const [streamingMessage] = useAtom(streamingMessageAtom);
  const [activeProcessId] = useAtom(activeProcessIdAtom);
  const [currentSessionId] = useAtom(currentSessionIdAtom);
  const [sessions] = useAtom(sessionsAtom);
  const [streamingError] = useAtom(streamingErrorAtom);
  const [isThinking] = useAtom(isThinkingAtom);
  const [lastQueryCost] = useAtom(lastQueryCostAtom);
  const sendMessage = useSetAtom(sendMessageAtom);
  const stopSession = useSetAtom(stopSessionAtom);
  const resumeSession = useSetAtom(resumeSessionAtom);

  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set up streaming listener for active process
  useClaudeStream(activeProcessId);

  // Local state for resume options
  const [permissionMode, setPermissionMode] =
    useState<PermissionMode>("default");
  const [isResuming, setIsResuming] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Get current session info
  const currentSession = currentSessionId
    ? sessions.find((s) => s.sessionId === currentSessionId)
    : null;

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, Boolean(streamingMessage), isThinking]);

  const handleSubmit = async (
    { text }: { text: string; files: FileUIPart[] },
    e: React.FormEvent
  ) => {
    e.preventDefault();
    if (!text.trim() || isStreaming || isSending) return;

    // If no active process but we have a session, try to resume it first
    if (!activeProcessId && currentSessionId && currentSession) {
      await handleResumeSession();
      // After resume, the message will be sent in the next interaction
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
    if (!currentSessionId || !currentSession) return;

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
  const renderMessage = (msg: SessionMessage, index: number) => {
    const isUser = msg.type === "user";
    const isSystem = msg.type === "system";
    const isError = msg.status === "error";
    // Safely format content to always return a string
    const content = formatMessageContent(
      msg.content || msg.message?.content || ""
    );

    // System messages (errors, info)
    if (isSystem) {
      return (
        <div
          key={msg.messageId || index}
          className={cn(
            "mx-auto flex max-w-[90%] items-start gap-2 rounded-md px-3 py-2 text-xs",
            isError
              ? "border border-destructive/20 bg-destructive/10 text-destructive"
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          {isError ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="break-words">{content}</span>
        </div>
      );
    }

    return (
      <Message
        key={msg.messageId || index}
        from={isUser ? "user" : "assistant"}
      >
        <MessageContent>
          {isUser ? content : <MessageResponse>{content}</MessageResponse>}
        </MessageContent>
      </Message>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && !isStreaming && !isThinking ? (
            <ConversationEmptyState
              title="No messages in this session"
              description="View conversation history from your Claude Code sessions"
              icon={<ChatCircle className="w-16 h-16 opacity-20" />}
            />
          ) : (
            <>
              {messages.map((msg, index) => renderMessage(msg, index))}

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
      <div className="border-t p-4 bg-background">
        {sendError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2 text-sm">
            <WarningCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-destructive">
                Failed to send message
              </div>
              <div className="text-destructive/80 mt-1">{sendError}</div>
            </div>
            <button
              onClick={() => setSendError(null)}
              className="text-destructive/60 hover:text-destructive"
            >
              ×
            </button>
          </div>
        )}

        {activeProcessId ? (
          // Active session - show full chat interface
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              placeholder={
                isStreaming || isThinking
                  ? "Waiting for response..."
                  : "Send a message... (Enter to send, Shift+Enter for new line)"
              }
              disabled={
                !activeProcessId || isStreaming || isThinking || isSending
              }
            />
            <div className="flex items-center gap-2 p-2">
              <div className="flex-1 text-xs text-muted-foreground flex items-center gap-2">
                {isStreaming || isThinking ? (
                  <>
                    <Spinner className="h-3 w-3 animate-spin" />
                    <span>
                      Claude is {isThinking ? "thinking" : "responding"}...
                    </span>
                  </>
                ) : lastQueryCost !== null ? (
                  <span>Last query cost: ${lastQueryCost.toFixed(4)}</span>
                ) : (
                  <span>Claude Code session active</span>
                )}
              </div>
              {isStreaming || isThinking ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStop}
                  className="gap-2"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop
                </Button>
              ) : (
                <PromptInputSubmit disabled={!activeProcessId || isSending}>
                  {isSending && (
                    <Spinner className="h-4 w-4 animate-spin mr-2" />
                  )}
                </PromptInputSubmit>
              )}
            </div>
          </PromptInput>
        ) : currentSessionId && currentSession ? (
          // Viewing mode - show resume options
          <div className="space-y-4">
            <div className="text-center text-sm text-foreground">
              <span className="font-medium">Session viewing mode</span>
              <span className="text-muted-foreground mx-2">•</span>
              <span className="text-muted-foreground">
                {currentSession.projectName}
              </span>
            </div>

            {/* Permission Mode Selector */}
            <PermissionModeSelector
              value={permissionMode}
              onChange={setPermissionMode}
              disabled={isResuming}
            />

            {/* Resume Button */}
            <Button
              onClick={handleResumeSession}
              disabled={isResuming}
              className="w-full gap-2"
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
                  Resume & Send Message
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Resuming will start a new Claude Code process connected to this
              session. You can then continue the conversation.
            </p>
          </div>
        ) : (
          // No session selected
          <div className="text-center text-sm text-muted-foreground py-2">
            Select a session from the sidebar to view or start a new session
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
