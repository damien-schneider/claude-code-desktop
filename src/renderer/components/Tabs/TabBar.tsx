import { X } from "@phosphor-icons/react";
import type React from "react";
import { cn } from "@/utils/tailwind";

export interface TabBarProps {
  className?: string;
  // Stub props for unused component
  openTabs?: Array<{ id: string; title: string }>;
  activeTabId?: string;
  onCloseTab?: (tabId: string) => void;
  onSetActiveTab?: (tabId: string) => void;
}

/**
 * Legacy tab bar component - currently unused
 * The app now uses navigation views (currentView) instead of browser-style tabs
 */
export const TabBar: React.FC<TabBarProps> = ({
  className,
  openTabs = [],
  activeTabId,
  onCloseTab,
  onSetActiveTab,
}) => {
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onCloseTab?.(tabId);
  };

  if (openTabs.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 border-b bg-muted/20 px-4 py-2",
          className
        )}
      >
        <span className="text-muted-foreground text-sm">No tabs open</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto border-b bg-muted/20 px-2 py-1",
        className
      )}
    >
      {openTabs.map((tab) => (
        <button
          className={cn(
            "group relative flex min-w-[120px] max-w-[200px] items-center gap-2 rounded-t-md px-3 py-2 text-sm transition-colors",
            activeTabId === tab.id
              ? "border border-b-0 bg-background text-foreground"
              : "text-muted-foreground hover:bg-muted/50"
          )}
          key={tab.id}
          onClick={() => onSetActiveTab?.(tab.id)}
        >
          <span className="truncate">{tab.title}</span>
          <button
            className={cn(
              "opacity-0 transition-opacity group-hover:opacity-100",
              activeTabId === tab.id && "opacity-100"
            )}
            onClick={(e) => handleTabClose(e, tab.id)}
          >
            <X className="h-3 w-3" weight="regular" />
          </button>
          {activeTabId === tab.id && (
            <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
