import {
  ArrowsClockwise,
  CaretDown,
  CaretRight,
  Folder,
  GitBranch,
  House,
  MagnifyingGlassIcon,
  Spinner,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
  ResizableHandle as PanelResizeHandle,
} from "@/components/ui/resizable";
import { ipc } from "@/ipc/manager";
import { BreadcrumbBar } from "@/renderer/components/breadcrumb/breadcrumb-bar";
import { ContentView } from "@/renderer/components/content/content-view";
import { NavigationSidebar } from "@/renderer/components/navigation/navigation-sidebar";
import { QuickOpenDialog } from "@/renderer/components/quick-open";
import {
  type ClaudeProject,
  filteredProjectsAtom,
  isGlobalSettingsSelectedAtom,
  isScanningAtom,
  scanProjectsAtom,
  searchQueryAtom,
  selectedProjectIdAtom,
  selectGlobalSettingsAtom,
  selectProjectAtom,
  setProjectsAtom,
} from "@/renderer/stores";
import { deduplicateProjects } from "@/renderer/stores/app-store";
import { cn } from "@/utils/tailwind";

function ClaudeCodeManagerPage() {
  const setProjects = useSetAtom(setProjectsAtom);
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const [isGlobalSettingsSelected] = useAtom(isGlobalSettingsSelectedAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [filteredProjects] = useAtom(filteredProjectsAtom);
  const selectProject = useSetAtom(selectProjectAtom);
  const selectGlobalSettings = useSetAtom(selectGlobalSettingsAtom);
  const [isScanning] = useAtom(isScanningAtom);
  const scanProjects = useSetAtom(scanProjectsAtom);

  // Quick Open dialog state
  const [isQuickOpenOpen, setIsQuickOpenOpen] = useState(false);

  // Left sidebar collapse state
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);

  // Collapsible sections state
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);

  // Quick Open handler
  const handleQuickOpen = () => setIsQuickOpenOpen(true);

  const handleScan = useCallback(async () => {
    await scanProjects();
  }, [scanProjects]);

  const handleProjectClick = useCallback(
    (projectPath: string) => {
      selectProject(projectPath);
    },
    [selectProject]
  );

  const handleGlobalSettingsClick = useCallback(() => {
    selectGlobalSettings();
  }, [selectGlobalSettings]);

  // Keyboard shortcut for Quick Open (Cmd/Ctrl + P or Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "p" || e.key === "k")) {
        e.preventDefault();
        setIsQuickOpenOpen(true);
      }
      // Escape to close
      if (e.key === "Escape" && isQuickOpenOpen) {
        setIsQuickOpenOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQuickOpenOpen]);

  useEffect(() => {
    // Initialize with current working directory
    const initializeProjects = async () => {
      try {
        // Get current working directory
        const cwd = await ipc.client.app.getCurrentWorkingDirectory();
        const projectName = cwd.split("/").pop() || cwd;

        // Create a project entry for the current directory
        const currentProject: ClaudeProject = {
          path: cwd,
          name: projectName,
          hasClaudeConfig: true, // Assume current project has .claude
          isFavorite: false,
        };

        // Load cached projects and add current directory
        const cached = await ipc.client.scanner.getCachedProjects();
        const allProjects = deduplicateProjects([
          currentProject,
          ...cached.projects,
        ]);
        setProjects(allProjects);

        // Auto-select the current working directory
        selectProject(cwd);
        console.log("Auto-selected current directory:", cwd);
      } catch (error) {
        console.error("Failed to initialize projects:", error);

        // Fallback: just load cached projects
        try {
          const cached = await ipc.client.scanner.getCachedProjects();
          if (cached.projects.length > 0) {
            setProjects(cached.projects);
          }
        } catch (fallbackError) {
          console.error("Failed to load cached projects:", fallbackError);
        }
      }
    };
    initializeProjects();
  }, [setProjects, selectProject]);

  return (
    <>
      <div className="flex h-full flex-col bg-background">
        {/* Top Breadcrumb Bar - full width */}
        <BreadcrumbBar onQuickOpen={handleQuickOpen} />

        {/* Main Content Area */}
        <div className="flex min-h-0 flex-1">
          <PanelGroup orientation="horizontal">
            <ProjectsSidebar
              filteredProjects={filteredProjects}
              isGlobalSettingsSelected={isGlobalSettingsSelected}
              isScanning={isScanning}
              leftSidebarCollapsed={leftSidebarCollapsed}
              onGlobalSettingsClick={handleGlobalSettingsClick}
              onProjectClick={handleProjectClick}
              onScan={handleScan}
              projectsOpen={projectsOpen}
              searchQuery={searchQuery}
              selectedProjectId={selectedProjectId ?? undefined}
              setLeftSidebarCollapsed={setLeftSidebarCollapsed}
              setProjectsOpen={setProjectsOpen}
              setSearchQuery={setSearchQuery}
              setSettingsOpen={setSettingsOpen}
              settingsOpen={settingsOpen}
            />

            <NavigationSidebar />

            <PanelResizeHandle />

            {/* Main Content + Nav */}
            <Panel className="" defaultSize="80%" minSize="50%">
              <div className="flex h-full min-w-0 overflow-hidden">
                {/* Navigation Sidebar - fixed width */}

                {/* Content View - takes remaining space */}
                <div className="h-full min-w-0 flex-1 overflow-hidden">
                  <ContentView />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {/* Quick Open Dialog */}
      <QuickOpenDialog
        onOpenChange={setIsQuickOpenOpen}
        open={isQuickOpenOpen}
      />
      <Toaster position="top-right" richColors />
    </>
  );
}

interface ProjectsSidebarProps {
  filteredProjects: ClaudeProject[];
  isGlobalSettingsSelected: boolean;
  isScanning: boolean;
  leftSidebarCollapsed: boolean;
  onGlobalSettingsClick: () => void;
  onProjectClick: (path: string) => void;
  onScan: () => void;
  projectsOpen: boolean;
  searchQuery: string;
  selectedProjectId?: string;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setProjectsOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSearchQuery: (query: string) => void;
}

function ProjectsSidebar({
  filteredProjects,
  isGlobalSettingsSelected,
  isScanning,
  leftSidebarCollapsed,
  onGlobalSettingsClick,
  onProjectClick,
  onScan,
  projectsOpen,
  searchQuery,
  selectedProjectId,
  setLeftSidebarCollapsed,
  setProjectsOpen,
  setSettingsOpen,
  settingsOpen,
  setSearchQuery,
}: ProjectsSidebarProps) {
  return (
    <Panel
      className="p-2 pr-0"
      collapsedSize={4}
      collapsible
      defaultSize={250}
      maxSize={350}
      minSize={210}
      onCollapse={() => setLeftSidebarCollapsed(true)}
      onExpand={() => setLeftSidebarCollapsed(false)}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-l-2xl bg-background-2">
        <SidebarHeader
          isScanning={isScanning}
          leftSidebarCollapsed={leftSidebarCollapsed}
          onScan={onScan}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <SidebarContent
          filteredProjects={filteredProjects}
          isGlobalSettingsSelected={isGlobalSettingsSelected}
          leftSidebarCollapsed={leftSidebarCollapsed}
          onGlobalSettingsClick={onGlobalSettingsClick}
          onProjectClick={onProjectClick}
          projectsOpen={projectsOpen}
          searchQuery={searchQuery}
          selectedProjectId={selectedProjectId}
          setProjectsOpen={setProjectsOpen}
          setSettingsOpen={setSettingsOpen}
          settingsOpen={settingsOpen}
        />
      </div>
    </Panel>
  );
}

interface SidebarHeaderProps {
  isScanning: boolean;
  leftSidebarCollapsed: boolean;
  onScan: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function SidebarHeader({
  isScanning,
  leftSidebarCollapsed,
  onScan,
  searchQuery,
  setSearchQuery,
}: SidebarHeaderProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex gap-2">
        {!leftSidebarCollapsed && (
          <div className="relative flex-1">
            <MagnifyingGlassIcon
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
        )}
      </div>

      <Button
        className={cn(
          "h-8 text-xs",
          leftSidebarCollapsed ? "w-8 p-0" : "justify-start px-2"
        )}
        disabled={isScanning}
        onClick={onScan}
        variant="default"
      >
        {isScanning ? (
          <Spinner
            className={cn(
              "h-3 w-3 animate-spin",
              !leftSidebarCollapsed && "mr-1"
            )}
            weight="regular"
          />
        ) : (
          <ArrowsClockwise
            className={cn("h-3 w-3", !leftSidebarCollapsed && "mr-1")}
            weight="regular"
          />
        )}
        {!leftSidebarCollapsed && (
          <span>{isScanning ? "Scanning..." : "Scan"}</span>
        )}
      </Button>
    </div>
  );
}

interface SidebarContentProps {
  filteredProjects: ClaudeProject[];
  isGlobalSettingsSelected: boolean;
  leftSidebarCollapsed: boolean;
  onGlobalSettingsClick: () => void;
  onProjectClick: (path: string) => void;
  projectsOpen: boolean;
  searchQuery: string;
  selectedProjectId?: string;
  setProjectsOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  settingsOpen: boolean;
}

function SidebarContent({
  filteredProjects,
  isGlobalSettingsSelected,
  leftSidebarCollapsed,
  onGlobalSettingsClick,
  onProjectClick,
  projectsOpen,
  searchQuery,
  selectedProjectId,
  setProjectsOpen,
  setSettingsOpen,
  settingsOpen,
}: SidebarContentProps) {
  return (
    <div className="flex-1 overflow-y-auto px-2 pb-2">
      <div className="flex flex-col gap-4">
        <SettingsSection
          isGlobalSettingsSelected={isGlobalSettingsSelected}
          leftSidebarCollapsed={leftSidebarCollapsed}
          onGlobalSettingsClick={onGlobalSettingsClick}
          open={settingsOpen}
          setOpen={setSettingsOpen}
        />
        <ProjectsSection
          filteredProjects={filteredProjects}
          leftSidebarCollapsed={leftSidebarCollapsed}
          onProjectClick={onProjectClick}
          open={projectsOpen}
          searchQuery={searchQuery}
          selectedProjectId={selectedProjectId}
          setOpen={setProjectsOpen}
        />
      </div>
    </div>
  );
}

interface SettingsSectionProps {
  isGlobalSettingsSelected: boolean;
  leftSidebarCollapsed: boolean;
  onGlobalSettingsClick: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

function SettingsSection({
  isGlobalSettingsSelected,
  leftSidebarCollapsed,
  onGlobalSettingsClick,
  open,
  setOpen,
}: SettingsSectionProps) {
  return (
    <Collapsible
      onOpenChange={setOpen}
      open={leftSidebarCollapsed ? false : open}
    >
      <div className="flex flex-col gap-1">
        <CollapsibleTrigger asChild disabled={leftSidebarCollapsed}>
          <button
            className={cn(
              "flex h-8 w-full items-center font-semibold text-muted-foreground text-xs hover:text-foreground",
              leftSidebarCollapsed ? "justify-center px-0" : "px-2"
            )}
            type="button"
          >
            <House
              className={cn("h-3.5 w-3.5", !leftSidebarCollapsed && "mr-2")}
              weight="regular"
            />
            {!leftSidebarCollapsed && (
              <>
                <span className="flex-1 text-left">Global Settings</span>
                {open ? (
                  <CaretDown className="h-3 w-3" weight="regular" />
                ) : (
                  <CaretRight className="h-3 w-3" weight="regular" />
                )}
              </>
            )}
          </button>
        </CollapsibleTrigger>
        {!leftSidebarCollapsed && (
          <CollapsibleContent>
            <div className="flex flex-col gap-1 pt-1">
              <button
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  isGlobalSettingsSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={onGlobalSettingsClick}
                type="button"
              >
                <Folder className="h-4 w-4" weight="regular" />
                <span className="truncate">~/.claude/</span>
              </button>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

interface ProjectsSectionProps {
  filteredProjects: ClaudeProject[];
  leftSidebarCollapsed: boolean;
  onProjectClick: (path: string) => void;
  open: boolean;
  searchQuery: string;
  selectedProjectId?: string;
  setOpen: (open: boolean) => void;
}

function ProjectsSection({
  filteredProjects,
  leftSidebarCollapsed,
  onProjectClick,
  open,
  searchQuery,
  selectedProjectId,
  setOpen,
}: ProjectsSectionProps) {
  return (
    <Collapsible
      onOpenChange={setOpen}
      open={leftSidebarCollapsed ? false : open}
    >
      <div className="flex flex-col gap-1">
        <CollapsibleTrigger asChild disabled={leftSidebarCollapsed}>
          <button
            className={cn(
              "flex h-8 w-full items-center font-semibold text-muted-foreground text-xs hover:text-foreground",
              leftSidebarCollapsed ? "justify-center px-0" : "px-2"
            )}
            type="button"
          >
            <Folder
              className={cn("h-3.5 w-3.5", !leftSidebarCollapsed && "mr-2")}
              weight="regular"
            />
            {!leftSidebarCollapsed && (
              <>
                <span className="flex-1 text-left">Projects</span>
                <span className="mr-2 text-[10px] tabular-nums opacity-70">
                  {filteredProjects.length}
                </span>
                {open ? (
                  <CaretDown className="h-3 w-3" weight="regular" />
                ) : (
                  <CaretRight className="h-3 w-3" weight="regular" />
                )}
              </>
            )}
          </button>
        </CollapsibleTrigger>
        {!leftSidebarCollapsed && (
          <CollapsibleContent>
            <div className="flex flex-col gap-1 pt-1">
              {filteredProjects.length === 0 ? (
                <div className="px-3 py-4 text-center text-muted-foreground text-xs italic">
                  {searchQuery ? "No projects match" : "No projects found"}
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <button
                    className={cn(
                      "group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      selectedProjectId === project.path
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    key={project.path}
                    onClick={() => onProjectClick(project.path)}
                    type="button"
                  >
                    <Folder className="h-4 w-4 shrink-0" weight="regular" />
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
                        className="h-3 w-3 shrink-0 opacity-60"
                        weight="regular"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

export const Route = createFileRoute("/")({
  component: ClaudeCodeManagerPage,
});
