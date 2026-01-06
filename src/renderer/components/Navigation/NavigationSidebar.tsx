import React, { useCallback } from "react";
import {
  FileText,
  Folder,
  GitBranch,
  Wrench,
  Sparkle,
  Users,
  Code,
  Gear,
  Database,
} from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { currentViewAtom, type NavigationView } from "@/renderer/stores";
import { cn } from "@/utils/tailwind";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavigationItem {
  id: NavigationView;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    weight?: React.ComponentProps<typeof Gear>["weight"];
  }>;
}

// All navigation items displayed directly
const ALL_NAV_ITEMS: NavigationItem[] = [
  { id: "files", label: "Files", icon: Folder },
  { id: "claudemd", label: "CLAUDE.md", icon: FileText },
  { id: "rules", label: "Rules", icon: GitBranch },
  { id: "skills", label: "Skills", icon: Sparkle },
  { id: "agents", label: "Agents", icon: Users },
  { id: "commands", label: "Commands", icon: Code },
  { id: "hooks", label: "Hooks", icon: Wrench },
  { id: "settings", label: "Settings", icon: Gear },
  { id: "mcp", label: "MCP Servers", icon: Database },
];

export interface NavigationSidebarProps {
  className?: string;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  className,
}) => {
  const [currentView, setCurrentView] = useAtom(currentViewAtom);

  const handleNavClick = useCallback(
    (viewId: NavigationView) => {
      setCurrentView(viewId);
    },
    [setCurrentView],
  );

  return (
    <TooltipProvider delayDuration={0}>
      <nav
        className={cn(
          "w-12 border-r bg-muted/30 flex flex-col h-full",
          className,
        )}
      >
        {/* Navigation Menu */}

        {ALL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center justify-center py-2.5 transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" weight="regular" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
};

export default NavigationSidebar;
