import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// =============================================================================
// App Mode
// =============================================================================

export type AppMode = "settings" | "chat";

export const appModeAtom = atom<AppMode>("settings");

export const setAppModeAtom = atom(null, (_get, set, mode: AppMode) => {
  set(appModeAtom, mode);
});

// =============================================================================
// Navigation & Project Selection
// =============================================================================

export type NavigationView =
  | "chat"
  | "claudemd"
  | "files"
  | "hooks"
  | "rules"
  | "skills"
  | "agents"
  | "commands"
  | "settings"
  | "mcp";

// Current view/tab
export const currentViewAtom = atom<NavigationView>("files");

// Set current view (write-only atom)
export const setCurrentViewAtom = atom(
  null,
  (_get, set, view: NavigationView) => {
    set(currentViewAtom, view);
  }
);

// Home path from main process (with setter)
export const homePathAtom = atom<string>("");
export const setHomePathAtom = atom(null, async (_get, set, path: string) => {
  set(homePathAtom, path);
});

// Track home path initialization state
export const homePathLoadingAtom = atom<boolean>(false);
export const homePathInitializedAtom = atom<boolean>(false);

// Write-only atom to initialize home path (fetches from main process)
export const initializeHomePathAtom = atom(null, async (get, set) => {
  const homePathInitialized = get(homePathInitializedAtom);
  const homePath = get(homePathAtom);

  // Already initialized
  if (homePathInitialized || homePath) {
    return;
  }

  set(homePathLoadingAtom, true);

  try {
    const { ipc } = await import("@/ipc/manager");
    const home = await ipc.client.app.getHomePath();
    set(homePathAtom, home);
    set(homePathInitializedAtom, true);
  } catch (error) {
    console.error("[initializeHomePathAtom] Failed to get home path:", error);
  } finally {
    set(homePathLoadingAtom, false);
  }
});

// Selected project ID
export const selectedProjectIdAtom = atom<string | null>(null);

// Whether global settings is selected
export const isGlobalSettingsSelectedAtom = atom<boolean>(false);

// =============================================================================
// Computed: Active Path (derived from selected project or global settings)
// =============================================================================

/**
 * The active path is the base path for the currently selected context.
 * It's either the global settings path (~/.claude/) or the selected project path.
 * This is used by all tabs (rules, skills, agents, hooks) to know where to operate.
 */
export const activePathAtom = atom<string>((get) => {
  const isGlobalSettingsSelected = get(isGlobalSettingsSelectedAtom);
  const homePath = get(homePathAtom);
  const selectedProjectId = get(selectedProjectIdAtom);

  // Global settings (~/.claude/) takes priority
  if (isGlobalSettingsSelected) {
    return homePath;
  }

  // Otherwise use selected project
  return selectedProjectId || "";
});

// =============================================================================
// Projects List
// =============================================================================

export interface ClaudeProject {
  path: string;
  name: string;
  hasClaudeConfig: boolean;
  isFavorite?: boolean;
  lastModified?: Date;
}

export const projectsAtom = atom<ClaudeProject[]>([]);

// =============================================================================
// UI State
// =============================================================================

export const leftSidebarCollapsedAtom = atom<boolean>(false);
export const rightSidebarCollapsedAtom = atom<boolean>(false);

// Re-export for compatibility
export const sidebarCollapsedAtom = leftSidebarCollapsedAtom;

export const isScanningAtom = atom<boolean>(false);

export const searchQueryAtom = atom<string>("");

export const showFavoritesOnlyAtom = atom<boolean>(false);

export const showWithClaudeOnlyAtom = atom<boolean>(false);

// =============================================================================
// Computed: Filtered Projects
// =============================================================================

/**
 * Derived atom that returns the filtered list of projects based on
 * search query and filter settings.
 */
export const filteredProjectsAtom = atom<ClaudeProject[]>((get) => {
  const projects = get(projectsAtom);
  const searchQuery = get(searchQueryAtom);
  const showFavoritesOnly = get(showFavoritesOnlyAtom);
  const showWithClaudeOnly = get(showWithClaudeOnlyAtom);

  let filtered = projects;

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.path.toLowerCase().includes(query)
    );
  }

  // Favorites filter
  if (showFavoritesOnly) {
    filtered = filtered.filter((p) => p.isFavorite);
  }

  // Claude config filter
  if (showWithClaudeOnly) {
    filtered = filtered.filter((p) => p.hasClaudeConfig);
  }

  return filtered;
});

// =============================================================================
// Favorites (persisted)
// =============================================================================

export const favoritePathsAtom = atomWithStorage<string[]>(
  "claude-code-manager-favorites",
  []
);

// =============================================================================
// Actions (write-only atoms)
// =============================================================================

// Set projects list
export const setProjectsAtom = atom(
  null,
  (_get, set, projects: ClaudeProject[]) => {
    set(projectsAtom, projects);
  }
);

// Select a project (clears global settings selection)
export const selectProjectAtom = atom(
  null,
  (_get, set, projectId: string | null) => {
    console.log("[selectProjectAtom] called with:", projectId);
    set(selectedProjectIdAtom, projectId);
    set(isGlobalSettingsSelectedAtom, false);
    set(currentViewAtom, "files");
    console.log(
      "[selectProjectAtom] completed - selectedProjectIdAtom set to:",
      projectId
    );
  }
);

// Select global settings (clears project selection)
export const selectGlobalSettingsAtom = atom(null, (_get, set) => {
  set(selectedProjectIdAtom, null);
  set(isGlobalSettingsSelectedAtom, true);
  set(currentViewAtom, "files");
});

// Toggle favorite
export const toggleFavoriteAtom = atom(
  null,
  (get, set, projectPath: string) => {
    const projects = get(projectsAtom);
    const favorites = get(favoritePathsAtom);

    const project = projects.find((p) => p.path === projectPath);
    if (!project) {
      return;
    }

    // Update project favorite status
    set(
      projectsAtom,
      projects.map((p) =>
        p.path === projectPath ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );

    // Update favorites list
    if (favorites.includes(projectPath)) {
      set(
        favoritePathsAtom,
        favorites.filter((p) => p !== projectPath)
      );
    } else {
      set(favoritePathsAtom, [...favorites, projectPath]);
    }
  }
);

// Set search query
export const setSearchQueryAtom = atom(null, (_get, set, query: string) => {
  set(searchQueryAtom, query);
});

// Toggle favorites filter
export const setShowFavoritesOnlyAtom = atom(null, (get, set) => {
  const current = get(showFavoritesOnlyAtom);
  set(showFavoritesOnlyAtom, !current);
});

// Toggle Claude filter
export const setShowWithClaudeOnlyAtom = atom(null, (get, set) => {
  const current = get(showWithClaudeOnlyAtom);
  set(showWithClaudeOnlyAtom, !current);
});

// Scan projects
export const scanProjectsAtom = atom(
  null,
  async (_get, set, options?: { maxDepth?: number }) => {
    set(isScanningAtom, true);
    try {
      const { ipc } = await import("@/ipc/manager");
      const { deduplicateProjects } = await import("./appStore");
      const { showWarning, showSuccess, showError } = await import(
        "@/renderer/lib/toast"
      );

      // Call the scanner IPC
      const result = await ipc.client.scanner.scanProjects(
        options || { maxDepth: 4 }
      );

      // Update projects with results
      set(projectsAtom, deduplicateProjects(result.projects));

      if (result.errors.length > 0) {
        showWarning(
          `Scan completed with ${result.errors.length} error(s). Check console for details.`
        );
        console.warn("Scan errors:", result.errors);
      } else {
        showSuccess(
          `Scan completed: found ${result.projects.length} project(s)`
        );
      }
    } catch (error) {
      const { showError } = await import("@/renderer/lib/toast");
      showError("Scan failed", error);
    } finally {
      set(isScanningAtom, false);
    }
  }
);
