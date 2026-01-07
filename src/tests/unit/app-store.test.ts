/**
 * Pragmatic tests for appStore
 * Tests Zustand store state management and deduplication logic
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  type ClaudeProject,
  deduplicateProjects,
  type NavigationView,
  useAppStore,
  useFavoriteStore,
} from "@/renderer/stores/appStore";

describe("AppStore", () => {
  beforeEach(() => {
    // Reset stores before each test
    useAppStore.setState({
      projects: [],
      selectedProjectId: null,
      isMainConfigSelected: false,
      sidebarCollapsed: false,
      searchQuery: "",
      showFavoritesOnly: false,
      showWithClaudeOnly: false,
      currentView: "files",
    });
    useFavoriteStore.setState({
      favoritePaths: [],
    });
  });

  describe("Initial State", () => {
    it("should have empty initial state", () => {
      const state = useAppStore.getState();

      expect(state.projects).toEqual([]);
      expect(state.selectedProjectId).toBeNull();
      expect(state.isMainConfigSelected).toBe(false);
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.searchQuery).toBe("");
      expect(state.showFavoritesOnly).toBe(false);
      expect(state.showWithClaudeOnly).toBe(false);
      expect(state.currentView).toBe("files");
    });
  });

  describe("Projects", () => {
    it("should set projects", () => {
      const projects: ClaudeProject[] = [
        { path: "/path/1", name: "Project 1", hasClaudeConfig: true },
        { path: "/path/2", name: "Project 2", hasClaudeConfig: false },
      ];

      useAppStore.getState().setProjects(projects);

      expect(useAppStore.getState().projects).toEqual(projects);
    });

    it("should select project by ID", () => {
      useAppStore.getState().selectProject("/test/project");

      expect(useAppStore.getState().selectedProjectId).toBe("/test/project");
      expect(useAppStore.getState().isMainConfigSelected).toBe(false);
      expect(useAppStore.getState().currentView).toBe("files");
    });

    it("should deselect project when null passed", () => {
      useAppStore.getState().selectProject("/test/project");
      expect(useAppStore.getState().selectedProjectId).toBe("/test/project");

      useAppStore.getState().selectProject(null);

      expect(useAppStore.getState().selectedProjectId).toBeNull();
    });

    it("should select main config", () => {
      useAppStore.getState().selectMainConfig();

      expect(useAppStore.getState().selectedProjectId).toBeNull();
      expect(useAppStore.getState().isMainConfigSelected).toBe(true);
      expect(useAppStore.getState().currentView).toBe("files");
    });
  });

  describe("Favorites", () => {
    it("should toggle project favorite status", () => {
      const projects: ClaudeProject[] = [
        { path: "/test/project", name: "Test", hasClaudeConfig: false },
      ];
      useAppStore.getState().setProjects(projects);

      useAppStore.getState().toggleFavorite("/test/project");

      expect(useAppStore.getState().projects[0].isFavorite).toBe(true);

      useAppStore.getState().toggleFavorite("/test/project");

      expect(useAppStore.getState().projects[0].isFavorite).toBe(false);
    });

    it("should not affect other projects when toggling favorite", () => {
      const projects: ClaudeProject[] = [
        { path: "/test/1", name: "Test 1", hasClaudeConfig: false },
        { path: "/test/2", name: "Test 2", hasClaudeConfig: false },
      ];
      useAppStore.getState().setProjects(projects);

      useAppStore.getState().toggleFavorite("/test/1");

      expect(useAppStore.getState().projects[0].isFavorite).toBe(true);
      expect(useAppStore.getState().projects[1].isFavorite).toBeUndefined();
    });
  });

  describe("UI State", () => {
    it("should set sidebar collapsed state", () => {
      useAppStore.getState().setSidebarCollapsed(true);

      expect(useAppStore.getState().sidebarCollapsed).toBe(true);

      useAppStore.getState().setSidebarCollapsed(false);

      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });

    it("should set search query", () => {
      useAppStore.getState().setSearchQuery("test query");

      expect(useAppStore.getState().searchQuery).toBe("test query");
    });

    it("should toggle favorites filter", () => {
      useAppStore.getState().setShowFavoritesOnly(true);

      expect(useAppStore.getState().showFavoritesOnly).toBe(true);

      useAppStore.getState().setShowFavoritesOnly(false);

      expect(useAppStore.getState().showFavoritesOnly).toBe(false);
    });

    it("should toggle Claude config filter", () => {
      useAppStore.getState().setShowWithClaudeOnly(true);

      expect(useAppStore.getState().showWithClaudeOnly).toBe(true);

      useAppStore.getState().setShowWithClaudeOnly(false);

      expect(useAppStore.getState().showWithClaudeOnly).toBe(false);
    });
  });

  describe("Navigation", () => {
    it("should set current view", () => {
      const views: NavigationView[] = [
        "claudemd",
        "files",
        "hooks",
        "rules",
        "skills",
        "agents",
        "commands",
      ];

      views.forEach((view) => {
        useAppStore.getState().setCurrentView(view);
        expect(useAppStore.getState().currentView).toBe(view);
      });
    });

    it("should default to files view when selecting project", () => {
      useAppStore.getState().setCurrentView("skills");
      expect(useAppStore.getState().currentView).toBe("skills");

      useAppStore.getState().selectProject("/test");

      expect(useAppStore.getState().currentView).toBe("files");
    });
  });

  describe("Filtered Projects", () => {
    const testProjects: ClaudeProject[] = [
      {
        path: "/test/project-one",
        name: "Project One",
        hasClaudeConfig: true,
        isFavorite: true,
      },
      {
        path: "/test/project-two",
        name: "Project Two",
        hasClaudeConfig: false,
      },
      {
        path: "/test/favorite",
        name: "Favorite Project",
        hasClaudeConfig: true,
        isFavorite: true,
      },
    ];

    beforeEach(() => {
      useAppStore.getState().setProjects(testProjects);
    });

    it("should return all projects when no filters applied", () => {
      const filtered = useAppStore.getState().getFilteredProjects();

      expect(filtered).toHaveLength(3);
    });

    it("should filter by search query", () => {
      useAppStore.getState().setSearchQuery("one");

      const filtered = useAppStore.getState().getFilteredProjects();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Project One");
    });

    it("should filter by path search", () => {
      useAppStore.getState().setSearchQuery("project-two");

      const filtered = useAppStore.getState().getFilteredProjects();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Project Two");
    });

    it("should filter by favorites", () => {
      useAppStore.getState().setShowFavoritesOnly(true);

      const filtered = useAppStore.getState().getFilteredProjects();

      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.isFavorite)).toBe(true);
    });

    it("should filter by hasClaudeConfig", () => {
      useAppStore.getState().setShowWithClaudeOnly(true);

      const filtered = useAppStore.getState().getFilteredProjects();

      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.hasClaudeConfig)).toBe(true);
    });

    it("should apply multiple filters together", () => {
      useAppStore.getState().setSearchQuery("favorite");
      useAppStore.getState().setShowFavoritesOnly(true);
      useAppStore.getState().setShowWithClaudeOnly(true);

      const filtered = useAppStore.getState().getFilteredProjects();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Favorite Project");
    });

    it("should be case-insensitive for search", () => {
      useAppStore.getState().setSearchQuery("PROJECT ONE");

      const filtered = useAppStore.getState().getFilteredProjects();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Project One");
    });
  });

  describe("Deduplication", () => {
    it("should remove duplicate projects by path", () => {
      const projects: ClaudeProject[] = [
        { path: "/test/1", name: "First", hasClaudeConfig: true },
        { path: "/test/1", name: "Duplicate", hasClaudeConfig: false },
        { path: "/test/2", name: "Second", hasClaudeConfig: true },
        { path: "/test/1", name: "Third Duplicate", hasClaudeConfig: true },
      ];

      const deduplicated = deduplicateProjects(projects);

      expect(deduplicated).toHaveLength(2);
      expect(deduplicated[0].name).toBe("First");
      expect(deduplicated[1].name).toBe("Second");
    });

    it("should handle empty array", () => {
      const deduplicated = deduplicateProjects([]);

      expect(deduplicated).toEqual([]);
    });

    it("should handle array with no duplicates", () => {
      const projects: ClaudeProject[] = [
        { path: "/test/1", name: "First", hasClaudeConfig: true },
        { path: "/test/2", name: "Second", hasClaudeConfig: true },
      ];

      const deduplicated = deduplicateProjects(projects);

      expect(deduplicated).toHaveLength(2);
    });
  });
});

describe("FavoriteStore", () => {
  beforeEach(() => {
    useFavoriteStore.setState({
      favoritePaths: [],
    });
  });

  describe("Initial State", () => {
    it("should have empty favorites", () => {
      expect(useFavoriteStore.getState().favoritePaths).toEqual([]);
    });
  });

  describe("Add Favorite", () => {
    it("should add favorite path", () => {
      useFavoriteStore.getState().addFavorite("/test/path");

      expect(useFavoriteStore.getState().favoritePaths).toEqual(["/test/path"]);
    });

    it("should add multiple favorites", () => {
      useFavoriteStore.getState().addFavorite("/test/1");
      useFavoriteStore.getState().addFavorite("/test/2");

      expect(useFavoriteStore.getState().favoritePaths).toHaveLength(2);
    });

    it("should allow duplicate paths", () => {
      useFavoriteStore.getState().addFavorite("/test/path");
      useFavoriteStore.getState().addFavorite("/test/path");

      expect(useFavoriteStore.getState().favoritePaths).toHaveLength(2);
    });
  });

  describe("Remove Favorite", () => {
    it("should remove favorite path", () => {
      useFavoriteStore.getState().addFavorite("/test/1");
      useFavoriteStore.getState().addFavorite("/test/2");

      useFavoriteStore.getState().removeFavorite("/test/1");

      expect(useFavoriteStore.getState().favoritePaths).toEqual(["/test/2"]);
    });

    it("should handle removing non-existent path", () => {
      useFavoriteStore.getState().addFavorite("/test/1");

      useFavoriteStore.getState().removeFavorite("/non-existent");

      expect(useFavoriteStore.getState().favoritePaths).toHaveLength(1);
    });

    it("should handle empty favorites", () => {
      useFavoriteStore.getState().removeFavorite("/test/path");

      expect(useFavoriteStore.getState().favoritePaths).toEqual([]);
    });
  });
});
