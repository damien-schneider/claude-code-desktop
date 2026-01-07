import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface ClaudeProject {
  path: string;
  name: string;
  hasClaudeConfig: boolean;
  isFavorite?: boolean;
  lastModified?: Date;
}

/**
 * Deduplicate projects by path, keeping the first occurrence of each unique path.
 * This prevents React key warnings when the same project appears multiple times.
 */
export function deduplicateProjects(
  projects: ClaudeProject[]
): ClaudeProject[] {
  const seen = new Set<string>();
  return projects.filter((project) => {
    if (seen.has(project.path)) {
      return false;
    }
    seen.add(project.path);
    return true;
  });
}

export type NavigationView =
  | "claudemd"
  | "files"
  | "hooks"
  | "rules"
  | "skills"
  | "agents"
  | "commands";

interface AppState {
  // Projects
  projects: ClaudeProject[];
  selectedProjectId: string | null;
  isMainConfigSelected: boolean;

  // UI State
  sidebarCollapsed: boolean;
  searchQuery: string;
  showFavoritesOnly: boolean;

  // Navigation (replaces tabs)
  currentView: NavigationView;

  // Actions
  setProjects: (projects: ClaudeProject[]) => void;
  selectProject: (projectId: string | null) => void;
  selectMainConfig: () => void;
  toggleFavorite: (projectId: string) => void;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchQuery: (query: string) => void;
  setShowFavoritesOnly: (show: boolean) => void;

  setCurrentView: (view: NavigationView) => void;

  // Computed getter
  getFilteredProjects: () => ClaudeProject[];
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      projects: [],
      selectedProjectId: null,
      isMainConfigSelected: false,
      sidebarCollapsed: false,
      searchQuery: "",
      showFavoritesOnly: false,
      currentView: "files",

      // Computed getter
      getFilteredProjects: () => {
        const state = get();
        let filtered = state.projects;

        // Search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.path.toLowerCase().includes(query)
          );
        }

        // Favorites filter
        if (state.showFavoritesOnly) {
          filtered = filtered.filter((p) => p.isFavorite);
        }

        return filtered;
      },

      // Project actions
      setProjects: (projects) => set({ projects }),

      selectProject: (projectId) =>
        set({
          selectedProjectId: projectId,
          isMainConfigSelected: false,
          currentView: "files", // Default to files view when selecting a project
        }),

      selectMainConfig: () =>
        set({
          selectedProjectId: null,
          isMainConfigSelected: true,
          currentView: "files",
        }),

      toggleFavorite: (projectId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.path === projectId ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        })),

      // UI actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),

      setCurrentView: (view) => set({ currentView: view }),
    }),
    { name: "ClaudeCodeManager" }
  )
);

// Persist favorites separately
interface FavoriteState {
  favoritePaths: string[];
  addFavorite: (path: string) => void;
  removeFavorite: (path: string) => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  devtools(
    persist(
      (set) => ({
        favoritePaths: [],
        addFavorite: (path: string) =>
          set((state: FavoriteState) => ({
            favoritePaths: [...state.favoritePaths, path],
          })),
        removeFavorite: (path: string) =>
          set((state: FavoriteState) => ({
            favoritePaths: state.favoritePaths.filter(
              (p: string) => p !== path
            ),
          })),
      }),
      {
        name: "claude-code-manager-favorites",
      }
    )
  )
);
