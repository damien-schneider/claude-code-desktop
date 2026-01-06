import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Sidebar } from "@/renderer/components/Sidebar";
import { NavigationSidebar } from "@/renderer/components/Navigation/NavigationSidebar";
import { ContentView } from "@/renderer/components/Content/ContentView";
import { BreadcrumbBar } from "@/renderer/components/Breadcrumb";
import { QuickOpenDialog } from "@/renderer/components/QuickOpen";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  setProjectsAtom,
  selectProjectAtom,
  isScanningAtom,
  scanProjectsAtom,
  type ClaudeProject,
} from "@/renderer/stores";
import { deduplicateProjects } from "@/renderer/stores/appStore";
import { Toaster } from "sonner";
import {
  showError,
  showSuccess,
  showWarning,
  withPromise,
} from "@/renderer/lib/toast";
import { ipc } from "@/ipc/manager";

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
      <div className="flex flex-col h-full">
        {/* Top Breadcrumb Bar - full width */}
        <BreadcrumbBar onQuickOpen={handleQuickOpen} />

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal">
            {/* Projects Sidebar */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <Sidebar
                onScan={() => scanProjects()}
                scanning={isScanning}
                className="w-full !border-r-0"
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Content + Nav */}
            <ResizablePanel defaultSize={80}>
              <div className="flex h-full">
                {/* Navigation Sidebar - fixed width */}
                <div className="flex-shrink-0 w-12 h-full">
                  <NavigationSidebar />
                </div>

                {/* Content View - takes remaining space */}
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                  <ContentView />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Quick Open Dialog */}
      <QuickOpenDialog
        open={isQuickOpenOpen}
        onOpenChange={setIsQuickOpenOpen}
      />
      <Toaster position="top-right" richColors />
    </>
  );
}

export const Route = createFileRoute("/")({
  component: ClaudeCodeManagerPage,
});
