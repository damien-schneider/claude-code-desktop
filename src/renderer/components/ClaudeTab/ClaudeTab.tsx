import { Check, X } from "@phosphor-icons/react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ipc } from "@/ipc/manager";
import { TipTapEditor } from "@/renderer/components/TipTapEditor";
import { showError, showSuccess } from "@/renderer/lib/toast";
import { useAppStore } from "@/renderer/stores";

export const ClaudeTab: React.FC = () => {
  const { selectedProjectId, isMainConfigSelected, currentView } =
    useAppStore();
  const [homePath, setHomePath] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [exists, setExists] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get home path from main process
  useEffect(() => {
    const getHome = async () => {
      try {
        const home = await ipc.client.app.getHomePath();
        setHomePath(home);
      } catch (error) {
        console.error("Failed to get home path:", error);
      }
    };
    getHome();
  }, []);

  const currentPath = isMainConfigSelected ? homePath : selectedProjectId || "";

  const loadClaudeMD = useCallback(async () => {
    if (!currentPath) {
      console.log("No current path, skipping CLAUDE.md load");
      return;
    }

    console.log("Loading CLAUDE.md from:", currentPath);
    setLoading(true);
    try {
      const result = await ipc.client.claude.getCLAUDEMD({
        projectPath: currentPath,
      });
      console.log("CLAUDE.md result:", result);
      setContent(result.content);
      setOriginalContent(result.content);
      setExists(result.exists);
    } catch (error) {
      showError("Failed to load CLAUDE.md", error);
      setContent("");
      setOriginalContent("");
      setExists(false);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Reload when switching to this tab or when path changes
  useEffect(() => {
    if (currentView === "claudemd") {
      loadClaudeMD();
    }
  }, [currentView, loadClaudeMD]);

  const handleSave = async () => {
    if (!currentPath) return;

    setSaving(true);
    try {
      const result = await ipc.client.claude.writeCLAUDEMD({
        projectPath: currentPath,
        content,
      });
      if (result.success) {
        setExists(true);
        setOriginalContent(content);
        showSuccess("CLAUDE.md saved successfully");
      }
    } catch (error) {
      showError("Failed to save CLAUDE.md", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
  };

  const hasChanges = content !== originalContent;

  // Keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges && !saving && !loading) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, saving, loading, handleSave]);

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Editor */}
        <div className="relative flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : (
            <TipTapEditor
              actions={
                <ButtonGroup>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={saving || loading || !hasChanges}
                        onClick={handleSave}
                        size="icon"
                        variant="default"
                      >
                        <Check className="h-4 w-4" weight="regular" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save (⌘S)</p>
                    </TooltipContent>
                  </Tooltip>
                  {hasChanges && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          disabled={saving || loading}
                          onClick={handleCancel}
                          size="icon"
                          variant="outline"
                        >
                          <X className="h-4 w-4" weight="regular" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel changes</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </ButtonGroup>
              }
              className="min-h-full"
              content={content}
              hasChanges={hasChanges}
              onChange={setContent}
              placeholder="# Project Instructions

Add your project-specific instructions for Claude Code here.

## Example sections:

- Architecture overview
- Coding standards
- Testing approach
- Deployment process
- Important conventions
"
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ClaudeTab;
