import {
  ChatCircleText,
  Code,
  Database,
  FileText,
  Folder,
  Gear,
  GitBranch,
  Sparkle,
  Users,
  Wrench,
} from "@phosphor-icons/react";
import { useAtom } from "jotai";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { currentViewAtom, type NavigationView } from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

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
  { id: "chat", label: "Chat", icon: ChatCircleText },
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

  const handleNavClick = (viewId: NavigationView) => {
    setCurrentView(viewId);
  };
  return (
    <div className="h-full shrink-0 py-2 pr-2">
      <div className="flex h-full flex-col rounded-r-2xl bg-background-2 py-1.5 pr-1.5">
        <TooltipProvider>
          <nav className={cn("flex h-full w-full flex-col gap-1", className)}>
            {/* Navigation Menu */}
            {ALL_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger>
                    <Button
                      className={cn("rounded-xl")}
                      onClick={() => handleNavClick(item.id)}
                      size={"icon"}
                      variant={isActive ? "default" : "ghost"}
                    >
                      <Icon className="h-5 w-5 shrink-0" weight="regular" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default NavigationSidebar;
