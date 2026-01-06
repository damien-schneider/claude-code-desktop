import React from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  CaretRight,
  MagnifyingGlass,
  Sidebar as SidebarIcon,
} from "@phosphor-icons/react";
import {
  currentViewAtom,
  selectedProjectIdAtom,
  isGlobalSettingsSelectedAtom,
  sidebarCollapsedAtom,
  appModeAtom,
} from "@/renderer/stores";
import { cn } from "@/utils/tailwind";
import { Button } from "@/components/ui/button";
import ModeToggle from "@/renderer/components/ModeToggle";

export interface BreadcrumbBarProps {
  className?: string;
  onQuickOpen?: () => void;
}

// View titles for breadcrumb
const VIEW_TITLES: Record<string, string> = {
  files: "Files",
  claudemd: "CLAUDE.md",
  rules: "Rules",
  skills: "Skills",
  agents: "Agents",
  hooks: "Hooks",
  commands: "Commands",
  settings: "Settings",
  mcp: "MCP",
};

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  className,
  onQuickOpen,
}) => {
  const [currentView] = useAtom(currentViewAtom);
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const [isGlobalSettingsSelected] = useAtom(isGlobalSettingsSelectedAtom);
  const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const [appMode] = useAtom(appModeAtom);

  // Build breadcrumb segments
  const segments = React.useMemo(() => {
    const result: { label: string; key: string }[] = [];

    // In chat mode, show "Chat Mode"
    if (appMode === 'chat') {
      result.push({ label: "Chat Mode", key: "mode" });
      return result;
    }

    // Context (project or global settings)
    if (isGlobalSettingsSelected) {
      result.push({ label: "Global Settings", key: "context" });
    } else if (selectedProjectId) {
      const projectName = selectedProjectId.split("/").pop() || "Project";
      result.push({ label: projectName, key: "context" });
    }

    // Current view
    result.push({
      label: VIEW_TITLES[currentView] || currentView,
      key: "view",
    });

    return result;
  }, [currentView, selectedProjectId, isGlobalSettingsSelected, appMode]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 border-b bg-background min-h-11 select-none",
        className,
      )}
      style={{ WebkitAppRegion: "drag" as any }}
    >
      {/* Sidebar Trigger - not draggable */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleToggleSidebar}
        data-sidebar="trigger"
        style={{ WebkitAppRegion: "no-drag" as any }}
      >
        <SidebarIcon className="h-4 w-4" weight="regular" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      {/* Breadcrumb - draggable for window movement */}
      <nav
        className="flex items-center gap-1 text-sm"
        aria-label="Breadcrumb"
        style={{ WebkitAppRegion: "drag" as any }}
      >
        {segments.map((segment, index) => (
          <React.Fragment key={segment.key}>
            {index > 0 && (
              <CaretRight
                className="h-4 w-4 text-muted-foreground"
                weight="regular"
              />
            )}
            <span
              className={cn(
                index === segments.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {segment.label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Quick Open Button - not draggable */}
      {onQuickOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onQuickOpen}
          className="h-7 gap-1.5 px-2"
          style={{ WebkitAppRegion: "no-drag" as any }}
        >
          <MagnifyingGlass className="h-3.5 w-3.5" weight="regular" />
          <kbd className="min-w-[1rem] px-1 py-0.5 text-[10px] font-mono text-muted-foreground/70 bg-muted/50 rounded">
            ⌘P
          </kbd>
        </Button>
      )}

      {/* Mode Toggle - not draggable */}
      <ModeToggle style={{ WebkitAppRegion: "no-drag" as any }} />
    </div>
  );
};

export default BreadcrumbBar;
