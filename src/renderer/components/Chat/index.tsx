import { CaretLeft, ChatCircle } from "@phosphor-icons/react";
import { useAtom, useSetAtom } from "jotai";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  activeProcessIdAtom,
  currentSessionIdAtom,
  loadSessionsAtom,
  selectedProjectIdAtom,
  startNewSessionAtom,
} from "@/renderer/stores";
import { cn } from "@/utils/tailwind";
import ChatArea from "./chat-area";
import SessionSidebar from "./session-sidebar";

export interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ className }) => {
  const [currentSessionId] = useAtom(currentSessionIdAtom);
  const [activeProcessId] = useAtom(activeProcessIdAtom);
  const loadSessions = useSetAtom(loadSessionsAtom);

  // Load sessions on mount
  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <ResizablePanelGroup
      className={cn("h-full", className)}
      direction="horizontal"
    >
      {/* Chat Area (Left/Center) */}
      <ResizablePanel defaultSize={70} minSize={30}>
        {currentSessionId || activeProcessId ? <ChatArea /> : <EmptyState />}
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Session Sidebar (Right) */}
      <ResizablePanel defaultSize={30} maxSize={40} minSize={15}>
        <SessionSidebar className="w-full" />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

// Empty State Component
const EmptyState: React.FC = () => {
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const startNewSession = useSetAtom(startNewSessionAtom);

  const handleStartNewSession = async () => {
    if (selectedProjectId) {
      try {
        await startNewSession(selectedProjectId);
      } catch (error) {
        console.error("Failed to start new session:", error);
      }
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="max-w-md space-y-4 text-center">
        <ChatCircle className="mx-auto h-16 w-16 text-muted-foreground/30" />
        <div>
          <h3 className="font-medium text-lg">No session selected</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            Select a session from the right sidebar to view the conversation
            history.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Button
              className="font-bold"
              disabled={!selectedProjectId}
              onClick={handleStartNewSession}
            >
              Start new session
            </Button>

            {!selectedProjectId && (
              <p className="flex animate-pulse items-center gap-1 text-muted-foreground text-xs">
                <CaretLeft className="h-4 w-4" /> Select a project from the left
                sidebar first
              </p>
            )}
          </div>

          <p className="mt-12 text-muted-foreground text-xs">
            Sessions are created when you use Claude Code in your terminal.
            Start a new conversation with{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">claude</code>{" "}
            in any project directory.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
