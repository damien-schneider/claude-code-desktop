import { createFileRoute } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { Toaster } from "sonner";

import {
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
  ResizableHandle as PanelResizeHandle,
} from "@/components/ui/resizable";

import { ipc } from "@/ipc/manager";
import { BreadcrumbBar } from "@/renderer/components/breadcrumb/breadcrumb-bar";
import { ContentView } from "@/renderer/components/content/content-view";
import { NavigationSidebar } from "@/renderer/components/navigation/navigation-sidebar";
import { ProjectsSidebar } from "@/renderer/components/projects/projects-sidebar";
import { QuickOpenDialog } from "@/renderer/components/quick-open";

import {
  scanProjectsAtom,
  selectGlobalSettingsAtom,
  selectProjectAtom,
  setProjectsAtom,
} from "@/renderer/stores";
import { quickOpenDialogOpenAtom } from "@/renderer/stores/ui-atoms";
import { deduplicateProjects } from "@/renderer/utils/projects";

function ClaudeCodeManagerPage() {
  const setProjects = useSetAtom(setProjectsAtom);
  const selectProject = useSetAtom(selectProjectAtom);
  const selectGlobalSettings = useSetAtom(selectGlobalSettingsAtom);
  const scanProjects = useSetAtom(scanProjectsAtom);
  const [isQuickOpenOpen, setIsQuickOpenOpen] = useAtom(
    quickOpenDialogOpenAtom
  );

  // Quick Open handler
  const handleQuickOpen = () => setIsQuickOpenOpen(true);

  const _handleScan = useCallback(async () => {
    await scanProjects();
  }, [scanProjects]);

  const _handleProjectClick = useCallback(
    (projectPath: string) => {
      selectProject(projectPath);
    },
    [selectProject]
  );

  const _handleGlobalSettingsClick = useCallback(() => {
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
  }, [isQuickOpenOpen, setIsQuickOpenOpen]);

  useEffect(() => {
    // Initialize with current working directory
    const initializeProjects = async () => {
      try {
        // Get current working directory
        const cwd = await ipc.client.app.getCurrentWorkingDirectory();
        const projectName = cwd.split("/").pop() || cwd;

        // Create a project entry for the current directory
        const currentProject = {
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
            <ProjectsSidebar />

            <NavigationSidebar />

            <PanelResizeHandle />

            {/* Main Content + Nav */}
            <Panel className="" defaultSize="80%" minSize="50%">
              <div className="flex h-full min-w-0 overflow-hidden">
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

export const Route = createFileRoute("/")({
  component: ClaudeCodeManagerPage,
});
