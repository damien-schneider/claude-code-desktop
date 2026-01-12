import {
  ArrowsClockwise,
  ChatCircle,
  Folder,
  MagnifyingGlass,
  Plus,
  Spinner,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { useAtom, useSetAtom } from "jotai";
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import {
  activeSessionsAtom,
  currentSessionIdAtom,
  filteredSessionsAtom,
  loadSessionDetailsAtom,
  loadSessionsAtom,
  projectsAtom,
  selectedProjectIdAtom,
  sessionFilterAtom,
  sessionSearchQueryAtom,
  sessionsLoadingAtom,
  startNewSessionAtom,
} from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

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
    if (!selectedProjectId) {
      return null;
    }
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

    for (const session of sessions) {
      const date = new Date(session.lastMessageAt);
      if (Number.isNaN(date.getTime())) {
        continue; // Skip invalid dates
      }

      if (date >= today) {
        groups.Today.push(session);
      } else if (date >= yesterday) {
        groups.Yesterday.push(session);
      } else if (date >= thisWeek) {
        groups["This Week"].push(session);
      } else {
        groups.Older.push(session);
      }
    }

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
    <div className="h-full shrink-0 py-2 pr-2">
      <div
        className={cn(
          "flex h-full flex-col rounded-2xl bg-background-2",
          className
        )}
      >
        <div className="flex flex-col gap-2 p-2 pr-3">
          {/* Search and Reload */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                value={searchQuery}
              />
            </div>
            <Button
              className={cn("h-9 w-9 shrink-0", loading && "animate-spin")}
              disabled={loading}
              onClick={handleReload}
              size="icon"
              title="Reload sessions"
              variant="ghost"
            >
              <ArrowsClockwise className="h-4 w-4" weight="regular" />
            </Button>
          </div>

          {/* Project Filter Toggle */}
          {selectedProjectId && (
            <div className="mt-2">
              <Toggle
                pressed={filter === "project"}
                onPressedChange={(pressed) => setFilter(pressed ? "project" : "all")}
                className="w-full"
                variant="outline"
              >
                <Folder className="mr-2 h-4 w-4" weight="regular" />
                {filter === "project"
                  ? currentProjectName || "Project"
                  : "All Sessions"}
              </Toggle>
            </div>
          )}

          {/* Actions */}
          <div className="mt-2">
            <Button
              className="w-full font-bold"
              disabled={!selectedProjectId}
              onClick={handleStartNewSession}
              variant="default"
            >
              <Plus className="mr-1 h-4 w-4" weight="bold" />
              Start new session
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 && !loading ? (
            <div className="px-3 py-8 text-center text-muted-foreground text-sm">
              <ChatCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />

              <p>No sessions found</p>
              <p className="mt-1 text-xs">
                Start a conversation in your terminal with Claude Code
              </p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(([groupName, groupSessions]) =>
              groupSessions.length > 0 ? (
                <React.Fragment key={groupName}>
                  <div className="px-3 py-2 font-medium text-muted-foreground text-xs">
                    {groupName}
                  </div>
                  <div className="flex flex-col gap-1">
                    {groupSessions.map((session) => (
                      <div
                        className="group/menu-item relative"
                        key={session.sessionId}
                      >
                        <button
                          className={cn(
                            "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                            currentSessionId === session.sessionId
                              ? "bg-primary text-primary-foreground hover:bg-primary"
                              : "text-foreground"
                          )}
                          onClick={() => handleSessionClick(session.sessionId)}
                          type="button"
                        >
                          <ChatCircle className="h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 truncate font-medium text-sm">
                              <span className="truncate">
                                {session.previewMessage || "Empty session"}
                              </span>
                              {isSessionStreaming(session.sessionId) && (
                                <Spinner
                                  className="h-3 w-3 shrink-0 animate-spin text-primary"
                                  weight="bold"
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Folder className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {session.projectName}
                              </span>
                              <span className="shrink-0">•</span>
                              <span className="shrink-0">
                                {formatDistanceToNow(
                                  new Date(session.lastMessageAt),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ) : null
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionSidebar;
