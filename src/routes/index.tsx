import { createFileRoute } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ipc } from "@/ipc/manager";
import { BreadcrumbBar } from "@/renderer/components/Breadcrumb";
import { ContentView } from "@/renderer/components/Content/ContentView";
import { NavigationSidebar } from "@/renderer/components/Navigation/NavigationSidebar";
import { QuickOpenDialog } from "@/renderer/components/QuickOpen";
import { Sidebar } from "@/renderer/components/Sidebar";
import {
  type ClaudeProject,
  isScanningAtom,
  scanProjectsAtom,
  selectProjectAtom,
  setProjectsAtom,
} from "@/renderer/stores";
import { deduplicateProjects } from "@/renderer/stores/appStore";

function ClaudeCodeManagerPage() {
  const setProjects = useSetAtom(setProjectsAtom);
  const selectProject = useSetAtom(selectProjectAtom);
  const [isScanning] = useAtom(isScanningAtom);
  const scanProjects = useSetAtom(scanProjectsAtom);

  // Quick Open dialog state
  const [isQuickOpenOpen, setIsQuickOpenOpen] = useState(false);

  // Quick Open handler
  const handleQuickOpen = () => setIsQuickOpenOpen(true);

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
      <div className="flex h-full flex-col">
        {/* Top Breadcrumb Bar - full width */}
        <BreadcrumbBar onQuickOpen={handleQuickOpen} />

        {/* Main Content Area */}
        <div className="flex min-h-0 flex-1">
          <ResizablePanelGroup direction="horizontal">
            {/* Projects Sidebar */}
            <ResizablePanel
              className="border-none p-1"
              defaultSize={20}
              maxSize={40}
              minSize={15}
            >
              <Sidebar
                className="w-full rounded-xl border border-border bg-muted/40"
                onScan={() => scanProjects()}
                scanning={isScanning}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Content + Nav */}
            <ResizablePanel defaultSize={80}>
              <div className="flex h-full">
                {/* Navigation Sidebar - fixed width */}
                <div className="h-full w-12 flex-shrink-0">
                  <NavigationSidebar />
                </div>

                {/* Content View - takes remaining space */}
                <div className="h-full min-w-0 flex-1 overflow-hidden">
                  <ContentView />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
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
