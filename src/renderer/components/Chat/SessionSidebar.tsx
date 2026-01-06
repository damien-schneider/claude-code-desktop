import React, { useMemo } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  MagnifyingGlass,
  Plus,
  ChatCircle,
  Folder,
  ArrowsClockwise,
  Spinner,
} from "@phosphor-icons/react";
import {
  filteredSessionsAtom,
  activeSessionsAtom,
  sessionSearchQueryAtom,
  loadSessionDetailsAtom,
  currentSessionIdAtom,
  loadSessionsAtom,
  sessionsLoadingAtom,
  sessionFilterAtom,
  selectedProjectIdAtom,
  projectsAtom,
  startNewSessionAtom,
  type SessionFilter,
} from "@/renderer/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sidebar as AppSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/app-sidebar";
import { cn } from "@/utils/tailwind";
import { formatDistanceToNow } from "date-fns";

export interface SessionSidebarProps {
  className?: string;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  className,
}) => {
  const [sessions] = useAtom(filteredSessionsAtom);
  const [activeSessions] = useAtom(activeSessionsAtom);
  const [searchQuery, setSearchQuery] = useAtom(sessionSearchQueryAtom);
  const [currentSessionId] = useAtom(currentSessionIdAtom);
  const [loading] = useAtom(sessionsLoadingAtom);
  const [filter, setFilter] = useAtom(sessionFilterAtom);
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const [projects] = useAtom(projectsAtom);

  const loadSessionDetails = useSetAtom(loadSessionDetailsAtom);
  const reloadSessions = useSetAtom(loadSessionsAtom);
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

  // Get current project name for the filter label
  const currentProjectName = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.path === selectedProjectId)?.name;
  }, [projects, selectedProjectId]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof sessions> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    sessions.forEach((session) => {
      const date = new Date(session.lastMessageAt);
      if (isNaN(date.getTime())) return; // Skip invalid dates

      if (date >= today) groups.Today.push(session);
      else if (date >= yesterday) groups.Yesterday.push(session);
      else if (date >= thisWeek) groups["This Week"].push(session);
      else groups.Older.push(session);
    });

    return groups;
  }, [sessions]);

  const handleSessionClick = (sessionId: string) => {
    loadSessionDetails(sessionId);
  };

  const handleReload = () => {
    reloadSessions();
  };

  const isSessionStreaming = (sessionId: string) => {
    return Array.from(activeSessions.values()).some(
      (s) => s.sessionId === sessionId && s.isStreaming
    );
  };

  return (
    <AppSidebar side="right" className={className}>
      <SidebarHeader>
        {/* Search and Reload */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className={cn("h-9 w-9 shrink-0", loading && "animate-spin")}
            onClick={handleReload}
            disabled={loading}
            title="Reload sessions"
          >
            <ArrowsClockwise className="h-4 w-4" weight="regular" />
          </Button>
        </div>

        {/* Project Filter Toggle */}
        {selectedProjectId && (
          <div className="mt-2">
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as SessionFilter)}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="project">
                  {currentProjectName || "Project"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Actions */}
        <div className="mt-2">
          <Button
            className="w-full font-bold"
            variant="default"
            size="default"
            onClick={handleStartNewSession}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-1" weight="bold" />
            Start new session
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sessions.length === 0 && !loading ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            <ChatCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No sessions found</p>
            <p className="text-xs mt-1">
              Start a conversation in your terminal with Claude Code
            </p>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([groupName, groupSessions]) =>
            groupSessions.length > 0 ? (
              <React.Fragment key={groupName}>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  {groupName}
                </div>
                <SidebarMenu>
                  {groupSessions.map((session) => (
                    <SidebarMenuItem key={session.sessionId}>
                      <SidebarMenuButton
                        isActive={currentSessionId === session.sessionId}
                        onClick={() => handleSessionClick(session.sessionId)}
                      >
                        <ChatCircle className="h-4 w-4" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium flex items-center gap-2">
                            <span className="truncate">{session.previewMessage || "Empty session"}</span>
                            {isSessionStreaming(session.sessionId) && (
                              <Spinner className="h-3 w-3 animate-spin text-primary flex-shrink-0" weight="bold" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Folder className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {session.projectName}
                            </span>
                            <span className="flex-shrink-0">•</span>
                            <span className="flex-shrink-0">
                              {formatDistanceToNow(
                                new Date(session.lastMessageAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </React.Fragment>
            ) : null
          )
        )}
      </SidebarContent>
    </AppSidebar>
  );
};

export default SessionSidebar;
