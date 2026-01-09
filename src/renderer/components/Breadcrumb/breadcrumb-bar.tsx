import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import React from "react";
import ToggleTheme from "@/components/toggle-theme";
import { Button } from "@/components/ui/button";
import {
  currentViewAtom,
  isGlobalSettingsSelectedAtom,
  selectedProjectIdAtom,
} from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

export interface BreadcrumbBarProps {
  className?: string;
  onQuickOpen?: () => void;
}

// View titles for breadcrumb
const VIEW_TITLES: Record<string, string> = {
  chat: "Chat",
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

  // Build breadcrumb segments
  const segments = React.useMemo(() => {
    const result: { label: string; key: string }[] = [];

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
  }, [currentView, selectedProjectId, isGlobalSettingsSelected]);

  return (
    <div
      className={cn(
        "flex select-none items-center gap-2 px-4",
        className
      )}
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Breadcrumb - draggable for window movement */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
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
                  : "text-muted-foreground"
              )}
            >
              {segment.label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <ToggleTheme />

        {/* Quick Open Button - not draggable */}
        {onQuickOpen && (
          <Button
            className="h-7 gap-1.5 px-2"
            onClick={onQuickOpen}
            size="sm"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            type="button"
            variant="ghost"
          >
            <MagnifyingGlass className="h-3.5 w-3.5" weight="regular" />
            <kbd className="min-w-[1rem] rounded bg-muted/50 px-1 py-0.5 font-mono text-[10px] text-muted-foreground/70">
              ⌘P
            </kbd>
          </Button>
        )}
      </div>
    </div>
  );
};

export default BreadcrumbBar;
