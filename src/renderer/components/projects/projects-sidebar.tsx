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
import { useAtom, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ResizablePanel as Panel } from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  filteredProjectsAtom,
  isGlobalSettingsSelectedAtom,
  isScanningAtom,
  scanProjectsAtom,
  searchQueryAtom,
  selectedProjectIdAtom,
  selectGlobalSettingsAtom,
  selectProjectAtom,
} from "@/renderer/stores";
import {
  leftSidebarCollapsedAtom,
  projectsSectionOpenAtom,
  settingsSectionOpenAtom,
} from "@/renderer/stores/ui-atoms";
import { cn } from "@/utils/tailwind";

export function ProjectsSidebar() {
  const [, setLeftSidebarCollapsed] = useAtom(leftSidebarCollapsedAtom);

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
        <SidebarHeader />
        <SidebarContent />
      </div>
    </Panel>
  );
}

function SidebarHeader() {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [isScanning] = useAtom(isScanningAtom);
  const [leftSidebarCollapsed] = useAtom(leftSidebarCollapsedAtom);
  const scanProjects = useSetAtom(scanProjectsAtom);

  return (
    <div className="flex flex-row gap-2 p-2">
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

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-8 w-8 p-0"
              disabled={isScanning}
              onClick={scanProjects}
              variant="default"
            >
              {isScanning ? (
                <Spinner className="h-3 w-3 animate-spin" weight="regular" />
              ) : (
                <ArrowsClockwise className="h-3 w-3" weight="regular" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Scan projects</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function SidebarContent() {
  return (
    <div className="flex-1 overflow-y-auto px-2 pb-2">
      <div className="flex flex-col gap-4">
        <SettingsSection />
        <ProjectsSection />
      </div>
    </div>
  );
}

function SettingsSection() {
  const [isGlobalSettingsSelected] = useAtom(isGlobalSettingsSelectedAtom);
  const [leftSidebarCollapsed] = useAtom(leftSidebarCollapsedAtom);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsSectionOpenAtom);
  const selectGlobalSettings = useSetAtom(selectGlobalSettingsAtom);

  return (
    <Collapsible
      onOpenChange={setSettingsOpen}
      open={leftSidebarCollapsed ? false : settingsOpen}
    >
      <div className="flex flex-col gap-1">
        {/* @ts-expect-error - asChild type definition issue in UI library */}
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex h-8 w-full items-center font-semibold text-muted-foreground text-xs hover:text-foreground",
              leftSidebarCollapsed ? "justify-center px-0" : "px-2"
            )}
            disabled={leftSidebarCollapsed}
            type="button"
          >
            <House
              className={cn("h-3.5 w-3.5", !leftSidebarCollapsed && "mr-2")}
              weight="regular"
            />
            {!leftSidebarCollapsed && (
              <>
                <span className="flex-1 text-left">Global Settings</span>
                {settingsOpen ? (
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
                onClick={selectGlobalSettings}
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

function ProjectsSection() {
  const [filteredProjects] = useAtom(filteredProjectsAtom);
  const [leftSidebarCollapsed] = useAtom(leftSidebarCollapsedAtom);
  const [projectsOpen, setProjectsOpen] = useAtom(projectsSectionOpenAtom);
  const [searchQuery] = useAtom(searchQueryAtom);
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const selectProject = useSetAtom(selectProjectAtom);

  return (
    <Collapsible
      onOpenChange={setProjectsOpen}
      open={leftSidebarCollapsed ? false : projectsOpen}
    >
      <div className="flex flex-col gap-1">
        {/* @ts-expect-error - asChild type definition issue in UI library */}
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex h-8 w-full items-center font-semibold text-muted-foreground text-xs hover:text-foreground",
              leftSidebarCollapsed ? "justify-center px-0" : "px-2"
            )}
            disabled={leftSidebarCollapsed}
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
                {projectsOpen ? (
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
                    onClick={() => selectProject(project.path)}
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
