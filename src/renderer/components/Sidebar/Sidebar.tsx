import React, { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlass,
  Folder,
  GitBranch,
  House,
  CaretDown,
  CaretRight,
  ArrowsClockwise,
  Spinner,
} from "@phosphor-icons/react";
import { useAtom, useSetAtom } from "jotai";
import {
  selectedProjectIdAtom,
  isGlobalSettingsSelectedAtom,
  searchQueryAtom,
  showWithClaudeOnlyAtom,
  filteredProjectsAtom,
  selectProjectAtom,
  selectGlobalSettingsAtom,
  setSearchQueryAtom,
  setShowWithClaudeOnlyAtom,
  sidebarCollapsedAtom,
} from "@/renderer/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar as AppSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/app-sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [sidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const state = sidebarCollapsed ? "collapsed" : "expanded";

  // Collapsible sections state
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+B is handled by the sidebar component itself
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleScan = useCallback(async () => {
    if (onScan) {
      await onScan();
    }
  }, [onScan]);

  const handleProjectClick = useCallback(
    (projectPath: string) => {
      selectProject(projectPath);
    },
    [selectProject],
  );

  const handleGlobalSettingsClick = useCallback(() => {
    selectGlobalSettings();
  }, [selectGlobalSettings]);

  return (
    <AppSidebar className={className}>
      {state === "expanded" && (
        <SidebarHeader>
          <div className="flex gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlass
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                weight="regular"
              />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Claude filter */}
          <Button
            variant={showWithClaudeOnly ? "default" : "outline"}
            size="sm"
            className="w-full mt-2"
            onClick={() => setShowWithClaudeOnlyAction()}
          >
            <GitBranch className="h-3 w-3 mr-1" weight="regular" />
            <span className="sidebar-label">Claude Projects Only</span>
          </Button>

          {/* Scan Button */}
          <Button
            variant="default"
            size="sm"
            className="w-full mt-2"
            onClick={handleScan}
            disabled={scanningProp}
          >
            {scanningProp ? (
              <>
                <Spinner
                  className="h-4 w-4 mr-1 animate-spin"
                  weight="regular"
                />
                <span className="sidebar-label">Scanning...</span>
              </>
            ) : (
              <>
                <ArrowsClockwise className="h-4 w-4 mr-1" weight="regular" />
                <span className="sidebar-label">Scan</span>
              </>
            )}
          </Button>
        </SidebarHeader>
      )}

      <SidebarContent>
        {/* When collapsed, show simplified list without collapsible sections */}
        {state === "collapsed" ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isGlobalSettingsSelected}
                onClick={handleGlobalSettingsClick}
              >
                <House className="h-4 w-4" weight="regular" />
              </SidebarMenuButton>
            </SidebarMenuItem>
            {filteredProjects.map((project) => (
              <SidebarMenuItem key={project.path}>
                <SidebarMenuButton
                  isActive={selectedProjectId === project.path}
                  onClick={() => handleProjectClick(project.path)}
                  title={project.name}
                >
                  <Folder className="h-4 w-4" weight="regular" />
                  {project.hasClaudeConfig && (
                    <GitBranch
                      className="h-3 w-3 absolute right-2 opacity-70"
                      weight="regular"
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : (
          <>
            {/* Global Settings */}
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel>
                    <House className="h-4 w-4 mr-2" weight="regular" />
                    <span className="sidebar-label">Global Settings</span>
                    {settingsOpen ? (
                      <CaretDown
                        className="ml-auto h-4 w-4 sidebar-label"
                        weight="regular"
                      />
                    ) : (
                      <CaretRight
                        className="ml-auto h-4 w-4 sidebar-label"
                        weight="regular"
                      />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={isGlobalSettingsSelected}
                          onClick={handleGlobalSettingsClick}
                        >
                          <Folder className="h-4 w-4" weight="regular" />
                          <span className="sidebar-label">~/.claude/</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            <SidebarSeparator />

            {/* Projects */}
            <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel>
                    <Folder className="h-4 w-4 mr-2" weight="regular" />
                    <span className="sidebar-label">Projects</span>
                    <SidebarMenuBadge className="ml-auto sidebar-label">
                      {filteredProjects.length}
                    </SidebarMenuBadge>
                    {projectsOpen ? (
                      <CaretDown
                        className="ml-auto h-4 w-4 sidebar-label"
                        weight="regular"
                      />
                    ) : (
                      <CaretRight
                        className="ml-auto h-4 w-4 sidebar-label"
                        weight="regular"
                      />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {filteredProjects.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center sidebar-label">
                          {searchQuery || showWithClaudeOnly
                            ? "No projects match"
                            : "No projects found"}
                        </div>
                      ) : (
                        filteredProjects.map((project) => (
                          <SidebarMenuItem key={project.path}>
                            <SidebarMenuButton
                              isActive={selectedProjectId === project.path}
                              onClick={() => handleProjectClick(project.path)}
                            >
                              <Folder className="h-4 w-4" weight="regular" />
                              <div className="flex-1 min-w-0 sidebar-label">
                                <div className="truncate font-medium">
                                  {project.name}
                                </div>
                                <div className="truncate text-xs opacity-70">
                                  {project.path}
                                </div>
                              </div>
                              {project.hasClaudeConfig && (
                                <GitBranch
                                  className="h-3 w-3 flex-shrink-0 opacity-70 sidebar-label"
                                  weight="regular"
                                />
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </>
        )}
      </SidebarContent>

      {state === "expanded" && (
        <SidebarFooter>
          <div className="text-xs text-muted-foreground text-center sidebar-label">
            Press ⌘B to toggle
          </div>
        </SidebarFooter>
      )}
    </AppSidebar>
  );
};

export default Sidebar;
