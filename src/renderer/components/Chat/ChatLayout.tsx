import React from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  currentSessionIdAtom,
  activeProcessIdAtom,
  loadSessionsAtom,
  selectedProjectIdAtom,
  startNewSessionAtom,
} from "@/renderer/stores";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChatCircle, CaretLeft } from "@phosphor-icons/react";
import SessionSidebar from "./SessionSidebar";
import ChatArea from "./ChatArea";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind";

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
      direction="horizontal"
      className={cn("h-full", className)}
    >
      {/* Chat Area (Left/Center) */}
      <ResizablePanel defaultSize={70} minSize={30}>
        {currentSessionId || activeProcessId ? <ChatArea /> : <EmptyState />}
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Session Sidebar (Right) */}
      <ResizablePanel defaultSize={30} minSize={15} maxSize={40}>
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
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md">
        <ChatCircle className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <div>
          <h3 className="text-lg font-medium">No session selected</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Select a session from the right sidebar to view the conversation
            history.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Button
              onClick={handleStartNewSession}
              disabled={!selectedProjectId}
              className="font-bold"
            >
              Start new session
            </Button>

            {!selectedProjectId && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                <CaretLeft className="w-4 h-4" /> Select a project from the left
                sidebar first
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-12">
            Sessions are created when you use Claude Code in your terminal.
            Start a new conversation with{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-xs">claude</code>{" "}
            in any project directory.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
