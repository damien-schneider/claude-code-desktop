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
  Lock,
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
  activeSessionsAtom,
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatCircle } from "@phosphor-icons/react";
import { cn } from "@/utils/tailwind";
import type { FileUIPart } from "ai";

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
  }, [messages.length, Boolean(streamingMessage), isThinking]);

  const handleSubmit = async (
    { text }: { text: string; files: FileUIPart[] },
    e: React.FormEvent
  ) => {
    e.preventDefault();
    if (!text.trim() || isStreaming || isSending) return;

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

        {/* Permission Mode Selector - always visible at top of input area */}
        <div className="mb-3 flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Permission Mode
          </label>
          <Select
            value={permissionMode}
            onValueChange={(value) =>
              setPermissionMode(value as PermissionMode)
            }
            disabled={!!activeProcessId || isResuming}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select mode">
                {permissionMode === "default" && "🔐 Default"}
                {permissionMode === "plan" && "📋 Plan"}
                {permissionMode === "acceptEdits" && "⚡ Auto-accept"}
                {permissionMode === "bypassPermissions" && "⚠️ Bypass"}
                {permissionMode === "delegate" && "🤝 Delegate"}
                {permissionMode === "dontAsk" && "🚫 Don't Ask"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                <div className="flex items-center gap-2">
                  <span>🔐</span>
                  <div>
                    <div className="font-medium">Default</div>
                    <div className="text-xs text-muted-foreground">
                      Ask for tool permissions
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="plan">
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <div>
                    <div className="font-medium">Plan</div>
                    <div className="text-xs text-muted-foreground">
                      Read-only planning mode
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="acceptEdits">
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <div>
                    <div className="font-medium">Auto-accept</div>
                    <div className="text-xs text-muted-foreground">
                      Auto-accept edit permissions
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="bypassPermissions">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <div>
                    <div className="font-medium">Bypass</div>
                    <div className="text-xs text-muted-foreground">
                      Skip all permission checks
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="delegate">
                <div className="flex items-center gap-2">
                  <span>🤝</span>
                  <div>
                    <div className="font-medium">Delegate</div>
                    <div className="text-xs text-muted-foreground">
                      Delegate mode for subagents
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="dontAsk">
                <div className="flex items-center gap-2">
                  <span>🚫</span>
                  <div>
                    <div className="font-medium">Don't Ask</div>
                    <div className="text-xs text-muted-foreground">
                      Don't ask for permissions
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isSessionActiveElsewhere ? (
          // Session is active elsewhere - show resume button with disabled input
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md border">
              <Lock className="h-4 w-4" />
              <span>
                This session is running elsewhere. Resume to take control.
              </span>
            </div>
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
                  Resume Session
                </>
              )}
            </Button>
          </div>
        ) : currentSessionId || activeProcessId ? (
          // Session selected or active - show chat interface
          <PromptInput onSubmit={handleSubmit}>
            <div className="absolute -top-6 left-0 flex items-center gap-2 px-1 select-none pointer-events-none">
              {activeProcessId && (isStreaming || isThinking) ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground animate-pulse uppercase tracking-wider">
                    Claude is {isThinking ? "thinking" : "responding"}...
                  </span>
                </div>
              ) : activeProcessId ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Claude Code active
                  </span>
                </div>
              ) : null}
            </div>
            {lastQueryCost !== null && !isStreaming && !isThinking && (
              <Badge
                variant="outline"
                className="absolute top-2 right-2 opacity-0 group-hover/input-group:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm z-10"
              >
                Last query cost: ${lastQueryCost.toFixed(4)}
              </Badge>
            )}
            <PromptInputTextarea
              placeholder={
                isStreaming || isThinking
                  ? "Waiting for response..."
                  : activeProcessId
                    ? "Send a message... (Enter to send, Shift+Enter for new line)"
                    : "Start a new session... (Enter to send, Shift+Enter for new line)"
              }
              disabled={isStreaming || isThinking || isSending}
            />
            <div className="flex items-center gap-2 p-2 justify-end">
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
                <PromptInputSubmit disabled={isSending}>
                  {isSending && (
                    <Spinner className="h-4 w-4 animate-spin mr-2" />
                  )}
                </PromptInputSubmit>
              )}
            </div>
          </PromptInput>
        ) : (
          // No session selected
          <div className="text-center text-sm text-muted-foreground py-8">
            <ChatCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
            Select a session from the sidebar to view or start a new session
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
