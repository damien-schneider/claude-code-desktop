import {
  ArrowsClockwise,
  CaretDown,
  CaretRight,
  Folder,
  GitBranch,
  House,
  MagnifyingGlass,
  Spinner,
} from "@phosphor-icons/react";
import { useAtom, useSetAtom } from "jotai";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  filteredProjectsAtom,
  isGlobalSettingsSelectedAtom,
  searchQueryAtom,
  selectedProjectIdAtom,
  selectGlobalSettingsAtom,
  selectProjectAtom,
  setShowWithClaudeOnlyAtom,
  showWithClaudeOnlyAtom,
  sidebarCollapsedAtom,
} from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

export interface SidebarProps {
  className?: string;
  onScan?: () => Promise<void>;
  scanning?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  onScan,
  scanning: scanningProp = false,
}) => {
  // Jotai atoms
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const [isGlobalSettingsSelected] = useAtom(isGlobalSettingsSelectedAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [showWithClaudeOnly] = useAtom(showWithClaudeOnlyAtom);
  const [filteredProjects] = useAtom(filteredProjectsAtom);

  const [, selectProject] = useAtom(selectProjectAtom);
  const [, selectGlobalSettings] = useAtom(selectGlobalSettingsAtom);

  const setShowWithClaudeOnlyAction = useSetAtom(setShowWithClaudeOnlyAtom);
  const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const state = sidebarCollapsed ? "collapsed" : "expanded";

  // Collapsible sections state
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSidebarCollapsed]);

  const handleScan = useCallback(async () => {
    if (onScan) {
      await onScan();
    }
  }, [onScan]);

  const handleProjectClick = useCallback(
    (projectPath: string) => {
      selectProject(projectPath);
    },
    [selectProject]
  );

  const handleGlobalSettingsClick = useCallback(() => {
    selectGlobalSettings();
  }, [selectGlobalSettings]);

  const MenuItem = ({
    isActive,
    onClick,
    children,
    title,
    className: itemClassName,
  }: {
    isActive?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
  }) => (
    <button
      className={cn(
        "group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-accent-foreground",
        state === "collapsed" && "justify-center px-1.5",
        itemClassName
      )}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {state === "expanded" && (
        <div className="flex flex-col gap-2 p-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass
                className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                weight="regular"
              />
              <Input
                className="h-8 pl-8 text-xs"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                value={searchQuery}
              />
            </div>
          </div>

          <Button
            className="h-8 justify-start px-2 text-xs"
            onClick={() => setShowWithClaudeOnlyAction()}
            variant={showWithClaudeOnly ? "default" : "outline"}
          >
            <GitBranch className="mr-1 h-3 w-3" weight="regular" />
            <span>Claude Projects Only</span>
          </Button>

          <Button
            className="h-8 justify-start px-2 text-xs"
            disabled={scanningProp}
            onClick={handleScan}
            variant="default"
          >
            {scanningProp ? (
              <>
                <Spinner
                  className="mr-1 h-3 w-3 animate-spin"
                  weight="regular"
                />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <ArrowsClockwise className="mr-1 h-3 w-3" weight="regular" />
                <span>Scan</span>
              </>
            )}
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {state === "collapsed" ? (
          <div className="flex flex-col gap-1 py-2">
            <MenuItem
              isActive={isGlobalSettingsSelected}
              onClick={handleGlobalSettingsClick}
              title="Global Settings"
            >
              <House className="h-4 w-4" weight="regular" />
            </MenuItem>
            {filteredProjects.map((project) => (
              <MenuItem
                isActive={selectedProjectId === project.path}
                key={project.path}
                onClick={() => handleProjectClick(project.path)}
                title={project.name}
              >
                <Folder className="h-4 w-4" weight="regular" />
              </MenuItem>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Global Settings */}
            <Collapsible onOpenChange={setSettingsOpen} open={settingsOpen}>
              <div className="flex flex-col gap-1">
                <CollapsibleTrigger asChild>
                  <button
                    className="flex h-8 w-full cursor-pointer items-center px-2 font-semibold text-muted-foreground text-xs hover:text-foreground"
                    type="button"
                  >
                    <House className="mr-2 h-3.5 w-3.5" weight="regular" />
                    <span className="flex-1 text-left">Global Settings</span>
                    {settingsOpen ? (
                      <CaretDown className="h-3 w-3" weight="regular" />
                    ) : (
                      <CaretRight className="h-3 w-3" weight="regular" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-1 pt-1">
                    <MenuItem
                      isActive={isGlobalSettingsSelected}
                      onClick={handleGlobalSettingsClick}
                    >
                      <Folder className="h-4 w-4" weight="regular" />
                      <span className="truncate">~/.claude/</span>
                    </MenuItem>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Projects */}
            <Collapsible onOpenChange={setProjectsOpen} open={projectsOpen}>
              <div className="flex flex-col gap-1">
                <CollapsibleTrigger asChild>
                  <button
                    className="flex h-8 w-full cursor-pointer items-center px-2 font-semibold text-muted-foreground text-xs hover:text-foreground"
                    type="button"
                  >
                    <Folder className="mr-2 h-3.5 w-3.5" weight="regular" />
                    <span className="flex-1 text-left">Projects</span>
                    <span className="mr-2 text-[10px] tabular-nums opacity-70">
                      {filteredProjects.length}
                    </span>
                    {projectsOpen ? (
                      <CaretDown className="h-3 w-3" weight="regular" />
                    ) : (
                      <CaretRight className="h-3 w-3" weight="regular" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-1 pt-1">
                    {filteredProjects.length === 0 ? (
                      <div className="px-3 py-4 text-center text-muted-foreground text-xs italic">
                        {searchQuery || showWithClaudeOnly
                          ? "No projects match"
                          : "No projects found"}
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <MenuItem
                          isActive={selectedProjectId === project.path}
                          key={project.path}
                          onClick={() => handleProjectClick(project.path)}
                        >
                          <Folder
                            className="h-4 w-4 shrink-0"
                            weight="regular"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium leading-tight">
                              {project.name}
                            </div>
                            <div className="truncate text-[10px] leading-tight opacity-60">
                              {project.path}
                            </div>
                          </div>
                          {project.hasClaudeConfig && (
                            <GitBranch
                              className="h-3 w-3 flex-shrink-0 opacity-60"
                              weight="regular"
                            />
                          )}
                        </MenuItem>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        )}
      </div>

      {state === "expanded" && (
        <div className="border-t p-2">
          <div className="text-center text-[10px] text-muted-foreground">
            Press ⌘B to toggle
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
