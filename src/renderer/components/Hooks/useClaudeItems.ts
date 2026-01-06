import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { ipc } from "@/ipc/manager";
import { showError, showSuccess } from "@/renderer/lib/toast";
import {
  activePathAtom,
  currentViewAtom,
  homePathAtom,
  homePathInitializedAtom,
  initializeHomePathAtom,
} from "@/renderer/stores";

export type ClaudeItemType =
  | "skills"
  | "commands"
  | "agents"
  | "rules"
  | "hooks";

export interface ClaudeItem {
  name: string;
  path: string;
  content: string;
  type: "file" | "directory";
}

interface UseClaudeItemsOptions {
  type: ClaudeItemType;
  currentView: string;
}

// Format type for display (e.g., 'skills' -> 'Skill')
function formatType(type: ClaudeItemType): string {
  const singular = type.endsWith("s") ? type.slice(0, -1) : type;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

/**
 * Simple hook for loading Claude items
 * Loads items when the view becomes active or when activePath changes
 */
export function useClaudeItems({
  type,
  currentView: viewName,
}: UseClaudeItemsOptions) {
  const [activePath] = useAtom(activePathAtom);
  const [homePath] = useAtom(homePathAtom);
  const [homeInitialized] = useAtom(homePathInitializedAtom);
  const [currentView] = useAtom(currentViewAtom);
  const initializeHomePath = useSetAtom(initializeHomePathAtom);

  const [items, setItems] = useState<ClaudeItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize home path once (across all hook instances)
  useEffect(() => {
    if (!(homeInitialized || homePath)) {
      initializeHomePath();
    }
  }, [homeInitialized, homePath, initializeHomePath]);

  // Load items function
  const loadItems = useCallback(async () => {
    if (!activePath) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const result = await ipc.client.claude.readClaudeDirectory({
        projectPath: activePath,
        type,
      });

      const itemList: ClaudeItem[] = result.files.map((file: any) => ({
        name: file.name,
        path: file.path,
        content: file.content || "",
        type: file.type,
      }));

      setItems(itemList);
    } catch (error) {
      showError(`Failed to load ${formatType(type)} items`, error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activePath, type]);

  // Load when view becomes active or path changes
  useEffect(() => {
    if (currentView === viewName) {
      loadItems();
    }
  }, [currentView, viewName, loadItems]);

  const createItem = useCallback(
    async (name?: string) => {
      if (!activePath) {
        showError(
          "Cannot create item",
          "Please select a project or global settings first"
        );
        return {
          success: false,
          error: "Please select a project or global settings first",
        };
      }

      try {
        const result = await ipc.client.claude.createClaudeItem({
          projectPath: activePath,
          type,
          name: name || undefined,
        });

        await loadItems();
        showSuccess(`${formatType(type)} created successfully`);
        return { success: true, path: result.path, name: result.name };
      } catch (error) {
        showError(`Failed to create ${formatType(type)}`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [activePath, type, loadItems]
  );

  const deleteItem = useCallback(
    async (itemPath: string) => {
      try {
        await ipc.client.claude.deleteClaudeItem({ itemPath });
        await loadItems();
        showSuccess(`${formatType(type)} deleted successfully`);
        return true;
      } catch (error) {
        showError(`Failed to delete ${formatType(type)}`, error);
        return false;
      }
    },
    [loadItems, type]
  );

  const saveItem = useCallback(
    async (itemPath: string, content: string) => {
      try {
        await ipc.client.claude.writeFileContent({
          filePath: itemPath,
          content,
        });
        showSuccess("Saved successfully");
        return true;
      } catch (error) {
        showError("Failed to save", error);
        return false;
      }
    },
    [type]
  );

  return {
    items,
    loading,
    activePath,
    homePath,
    loadItems,
    createItem,
    deleteItem,
    saveItem,
  };
}
