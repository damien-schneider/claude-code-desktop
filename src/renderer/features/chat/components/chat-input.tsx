import {
  Lock,
  Play,
  Spinner,
  StopCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import type { FileUIPart } from "ai";
import { useAtomValue, useSetAtom } from "jotai";
import { SendIcon } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectedProjectIdAtom } from "@/renderer/stores/atoms";
import {
  activeProcessIdAtom,
  activeSessionsAtom,
  currentSessionIdAtom,
  isStreamingAtom,
  isThinkingAtom,
  lastQueryCostAtom,
  type PermissionMode,
  stopSessionAtom,
} from "@/renderer/stores/chat-atoms";
import { PermissionModeSelector } from "./permission-mode-selector";
import { SessionStatus } from "./session-status";

interface ChatInputProps {
  isSending: boolean;
  isResuming: boolean;
  permissionMode: PermissionMode;
  onPermissionModeChange: (mode: PermissionMode) => void;
  onSubmit: (
    data: { text: string; files: FileUIPart[] },
    e: React.FormEvent
  ) => void;
  onResume: () => void;
  sendError: string | null;
  onClearError: () => void;
}

const ErrorBanner: React.FC<{
  error: string;
  onClear: () => void;
}> = ({ error, onClear }) => (
  <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm">
    <WarningCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
    <div className="flex-1">
      <div className="font-medium text-destructive">Failed to send message</div>
      <div className="mt-1 text-destructive/80">{error}</div>
    </div>
    <Button onClick={onClear} type="button" variant="destructive">
      ×
    </Button>
  </div>
);

const ResumeView: React.FC<{
  isResuming: boolean;
  onResume: () => void;
}> = ({ isResuming, onResume }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3 text-muted-foreground text-sm">
      <Lock className="h-4 w-4" />
      <span>This session is running elsewhere. Resume to take control.</span>
    </div>
    <Button
      className="w-full gap-2"
      disabled={isResuming}
      onClick={onResume}
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
);

export const ChatInput: React.FC<ChatInputProps> = ({
  isSending,
  isResuming,
  permissionMode,
  onPermissionModeChange,
  onSubmit,
  onResume,
  sendError,
  onClearError,
}) => {
  const activeProcessId = useAtomValue(activeProcessIdAtom);
  const currentSessionId = useAtomValue(currentSessionIdAtom);
  const selectedProjectId = useAtomValue(selectedProjectIdAtom);
  const isStreaming = useAtomValue(isStreamingAtom);
  const isThinking = useAtomValue(isThinkingAtom);
  const lastQueryCost = useAtomValue(lastQueryCostAtom);
  const activeSessions = useAtomValue(activeSessionsAtom);
  const stopSession = useSetAtom(stopSessionAtom);

  const isSessionActiveElsewhere = useMemo(
    () =>
      currentSessionId
        ? Array.from(activeSessions.values()).some(
            (s) =>
              s.sessionId === currentSessionId &&
              s.processId !== activeProcessId
          )
        : false,
    [currentSessionId, activeSessions, activeProcessId]
  );

  const getPlaceholderText = () => {
    if (isStreaming || isThinking) {
      return "Waiting for response...";
    }
    if (!selectedProjectId) {
      return "Select a project from the left sidebar to start...";
    }
    if (activeProcessId) {
      return "Send a message...";
    }
    return "Start a new session...";
  };

  const handleStop = async () => {
    try {
      await stopSession();
    } catch (error) {
      console.error("Failed to stop session:", error);
    }
  };

  if (
    !(
      isSessionActiveElsewhere ||
      currentSessionId ||
      activeProcessId ||
      selectedProjectId
    )
  ) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Select a project from the sidebar to start a new session
      </div>
    );
  }

  return (
    <div className="relative pr-2 pb-2">
      {sendError && <ErrorBanner error={sendError} onClear={onClearError} />}

      <PermissionModeSelector
        disabled={!!activeProcessId || isResuming}
        onChange={onPermissionModeChange}
        value={permissionMode}
      />

      {isSessionActiveElsewhere ? (
        <ResumeView isResuming={isResuming} onResume={onResume} />
      ) : (
        <PromptInput onSubmit={onSubmit}>
          <SessionStatus
            activeProcessId={activeProcessId}
            isStreaming={isStreaming}
            isThinking={isThinking}
          />
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
          <div className="flex items-center justify-end gap-2 p-1">
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
              <PromptInputSubmit
                className="flex h-14 min-h-0 rounded-xl"
                disabled={isSending || !selectedProjectId}
              >
                {isSending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    {currentSessionId || activeProcessId
                      ? "Sending..."
                      : "Starting..."}
                  </>
                ) : (
                  <SendIcon />
                )}
              </PromptInputSubmit>
            )}
          </div>
        </PromptInput>
      )}
    </div>
  );
};
