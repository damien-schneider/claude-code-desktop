import { WarningCircle } from "@phosphor-icons/react";
import type { FileUIPart } from "ai";
import { useAtom, useSetAtom } from "jotai";
import type React from "react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClaudeStream } from "@/renderer/hooks/use-claude-stream";
import { selectedProjectIdAtom } from "@/renderer/stores/atoms";
import {
  activeProcessIdAtom,
  currentSessionIdAtom,
  type PermissionMode,
  resumeSessionAtom,
  sendMessageAtom,
  sessionsAtom,
  startNewSessionAtom,
  streamingErrorAtom,
} from "@/renderer/stores/chat-atoms";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

export const ChatArea: React.FC = () => {
  const [activeProcessId] = useAtom(activeProcessIdAtom);
  const [currentSessionId] = useAtom(currentSessionIdAtom);
  const [sessions] = useAtom(sessionsAtom);
  const [streamingError] = useAtom(streamingErrorAtom);
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const sendMessage = useSetAtom(sendMessageAtom);
  const resumeSession = useSetAtom(resumeSessionAtom);
  const startNewSession = useSetAtom(startNewSessionAtom);

  // Set up streaming listener for active process
  useClaudeStream(activeProcessId);

  // Local state
  const [permissionMode, setPermissionMode] =
    useState<PermissionMode>("default");
  const [isResuming, setIsResuming] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Get current session info
  const currentSession = currentSessionId
    ? sessions.find((s) => s.sessionId === currentSessionId)
    : null;

  const handleStartNewSessionInternal = async (text: string) => {
    if (!selectedProjectId) {
      return;
    }
    setIsSending(true);
    try {
      setSendError(null);
      await startNewSession(selectedProjectId, text);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to start new session:", error);
      setSendError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessageOnly = async (text: string) => {
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

  const handleResumeAndSendMessage = async (text: string) => {
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
      // After successful resume, send the message
      await handleSendMessageOnly(text);
    } catch (error) {
      console.error("Failed to resume session:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setSendError(errorMessage);
    } finally {
      setIsResuming(false);
    }
  };

  const handleSubmit = async (
    { text }: { text: string; files: FileUIPart[] },
    e: React.FormEvent
  ) => {
    e.preventDefault();
    if (!text.trim() || isSending) {
      return;
    }

    // No session selected - start a new session with the first message
    if (!(activeProcessId || currentSessionId) && selectedProjectId) {
      await handleStartNewSessionInternal(text);
      return;
    }

    // If no active process but we have a session, try to resume it first
    if (!activeProcessId && currentSessionId && currentSession) {
      await handleResumeAndSendMessage(text);
      return;
    }

    await handleSendMessageOnly(text);
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

  return (
    <div className="flex h-full flex-col bg-background">
      <MessageList />

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

      <ChatInput
        isResuming={isResuming}
        isSending={isSending}
        onClearError={() => setSendError(null)}
        onPermissionModeChange={setPermissionMode}
        onResume={handleResumeSession}
        onSubmit={handleSubmit}
        permissionMode={permissionMode}
        sendError={sendError}
      />
    </div>
  );
};

export default ChatArea;
