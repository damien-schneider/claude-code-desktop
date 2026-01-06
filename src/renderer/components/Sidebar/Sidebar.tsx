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
import {
  Sidebar as AppSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/app-sidebar";
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
    [selectProject]
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
                className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                weight="regular"
              />
              <Input
                className="h-9 pl-8"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                value={searchQuery}
              />
            </div>
          </div>

          {/* Claude filter */}
          <Button
            className="mt-2 w-full"
            onClick={() => setShowWithClaudeOnlyAction()}
            size="sm"
            variant={showWithClaudeOnly ? "default" : "outline"}
          >
            <GitBranch className="mr-1 h-3 w-3" weight="regular" />
            <span className="sidebar-label">Claude Projects Only</span>
          </Button>

          {/* Scan Button */}
          <Button
            className="mt-2 w-full"
            disabled={scanningProp}
            onClick={handleScan}
            size="sm"
            variant="default"
          >
            {scanningProp ? (
              <>
                <Spinner
                  className="mr-1 h-4 w-4 animate-spin"
                  weight="regular"
                />
                <span className="sidebar-label">Scanning...</span>
              </>
            ) : (
              <>
                <ArrowsClockwise className="mr-1 h-4 w-4" weight="regular" />
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
                      className="absolute right-2 h-3 w-3 opacity-70"
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
            <Collapsible onOpenChange={setSettingsOpen} open={settingsOpen}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel>
                    <House className="mr-2 h-4 w-4" weight="regular" />
                    <span className="sidebar-label">Global Settings</span>
                    {settingsOpen ? (
                      <CaretDown
                        className="sidebar-label ml-auto h-4 w-4"
                        weight="regular"
                      />
                    ) : (
                      <CaretRight
                        className="sidebar-label ml-auto h-4 w-4"
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
            <Collapsible onOpenChange={setProjectsOpen} open={projectsOpen}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel>
                    <Folder className="mr-2 h-4 w-4" weight="regular" />
                    <span className="sidebar-label">Projects</span>
                    <SidebarMenuBadge className="sidebar-label ml-auto">
                      {filteredProjects.length}
                    </SidebarMenuBadge>
                    {projectsOpen ? (
                      <CaretDown
                        className="sidebar-label ml-auto h-4 w-4"
                        weight="regular"
                      />
                    ) : (
                      <CaretRight
                        className="sidebar-label ml-auto h-4 w-4"
                        weight="regular"
                      />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {filteredProjects.length === 0 ? (
                        <div className="sidebar-label px-3 py-4 text-center text-muted-foreground text-sm">
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
                              <div className="sidebar-label min-w-0 flex-1">
                                <div className="truncate font-medium">
                                  {project.name}
                                </div>
                                <div className="truncate text-xs opacity-70">
                                  {project.path}
                                </div>
                              </div>
                              {project.hasClaudeConfig && (
                                <GitBranch
                                  className="sidebar-label h-3 w-3 flex-shrink-0 opacity-70"
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
          <div className="sidebar-label text-center text-muted-foreground text-xs">
            Press ⌘B to toggle
          </div>
        </SidebarFooter>
      )}
    </AppSidebar>
  );
};

export default Sidebar;
