import React from "react";
import { useAtom, useSetAtom } from "jotai";
import { currentSessionIdAtom, loadSessionsAtom } from "@/renderer/stores";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChatCircle } from "@phosphor-icons/react";
import SessionSidebar from "./SessionSidebar";
import ChatArea from "./ChatArea";
import { cn } from "@/utils/tailwind";

export interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ className }) => {
  const [currentSessionId] = useAtom(currentSessionIdAtom);
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
      {/* Session Sidebar */}
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        <SessionSidebar />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Chat Area */}
      <ResizablePanel defaultSize={75}>
        {currentSessionId ? <ChatArea /> : <EmptyState />}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

// Empty State Component
const EmptyState: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md">
        <ChatCircle className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <div>
          <h3 className="text-lg font-medium">No session selected</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Select a session from the sidebar to view the conversation history.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
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
