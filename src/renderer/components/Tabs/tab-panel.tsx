import { Spinner } from "@phosphor-icons/react";
import React from "react";
import { cn } from "@/utils/tailwind";

export type TabType =
  | "claudemd"
  | "files"
  | "hooks"
  | "rules"
  | "skills"
  | "agents"
  | "settings"
  | "commands";

export interface TabPanelProps {
  className?: string;
  // Stub props for unused component
  activeTabId?: string;
  openTabs?: Array<{ id: string; title: string; type: TabType }>;
  selectedProjectId?: string | null;
  isMainConfigSelected?: boolean;
}

/**
 * Legacy tab panel component - currently unused
 * The app now uses ContentView with navigation views instead of browser-style tabs
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  className,
  activeTabId,
  openTabs = [],
  selectedProjectId,
  isMainConfigSelected,
}) => {
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  if (!activeTab) {
    return (
      <div className={cn("flex h-full items-center justify-center", className)}>
        <div className="text-center text-muted-foreground">
          <p className="mb-2 font-medium text-lg">No tab selected</p>
          <p className="text-sm">
            Select a project from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  // Extract nested ternary into separate variable
  const getContextName = (): string => {
    if (isMainConfigSelected) {
      return "Main Config (~/.claude/)";
    }
    if (selectedProjectId) {
      return selectedProjectId.split("/").pop() || "Project";
    }
    return "Unknown";
  };

  const contextName = getContextName();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Tab Header */}
      <div className="border-b bg-muted/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{activeTab.title}</h2>
            <p className="text-muted-foreground text-sm">{contextName}</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <React.Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <div className="p-4 text-muted-foreground">
            Tab content: {activeTab.type}
          </div>
        </React.Suspense>
      </div>
    </div>
  );
};

export default TabPanel;
