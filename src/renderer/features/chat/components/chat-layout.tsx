import { useSetAtom } from "jotai";
import { type FC, useEffect } from "react";
import {
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
  ResizableHandle as PanelResizeHandle,
} from "@/components/ui/resizable";
import { loadSessionsAtom } from "@/renderer/stores";
import { cn } from "@/utils/tailwind";
import { ChatArea } from "./chat-area";
import { SessionSidebar } from "./session-sidebar";

export interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout: FC<ChatLayoutProps> = ({ className }) => {
  const loadSessions = useSetAtom(loadSessionsAtom);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <PanelGroup className={cn("h-full", className)} orientation="horizontal">
      {/* Chat Area (Left/Center) */}
      <Panel defaultSize="70%" minSize="30%">
        <div className="h-full min-w-0 overflow-hidden">
          <ChatArea />
        </div>
      </Panel>

      <PanelResizeHandle />

      {/* Session Sidebar (Right) */}
      <Panel defaultSize={250} maxSize={350} minSize={210}>
        <div className="h-full min-w-0 overflow-hidden">
          <SessionSidebar className="w-full" />
        </div>
      </Panel>
    </PanelGroup>
  );
};

export default ChatLayout;
