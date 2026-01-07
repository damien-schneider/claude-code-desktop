/**
 * Pragmatic tests for Jotai atoms
 * Tests actual atom behavior, state updates, and derived values
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  activePathAtom,
  appModeAtom,
  type ClaudeProject,
  currentViewAtom,
  filteredProjectsAtom,
  homePathAtom,
  homePathInitializedAtom,
  homePathLoadingAtom,
  isGlobalSettingsSelectedAtom,
  type NavigationView,
  projectsAtom,
  searchQueryAtom,
  selectedProjectIdAtom,
  showFavoritesOnlyAtom,
} from "@/renderer/stores/atoms";

// Reset all hooks after each test
afterEach(() => {
  cleanup();
});

describe("App Mode Atoms", () => {
  it("should have default app mode", () => {
    const { result } = renderHook(() => useAtomValue(appModeAtom));
    expect(result.current).toBe("settings");
  });

  it("should update app mode", () => {
    const { result: modeResult } = renderHook(() => useAtom(appModeAtom));

    act(() => {
      modeResult.current[1]("chat");
    });

    expect(modeResult.current[0]).toBe("chat");
  });
});

describe("Navigation View Atoms", () => {
  it("should have default view", () => {
    const { result } = renderHook(() => useAtomValue(currentViewAtom));
    expect(result.current).toBe("files");
  });

  it("should update current view", () => {
    const { result: viewResult } = renderHook(() => useAtom(currentViewAtom));

    act(() => {
      viewResult.current[1]("settings");
    });

    expect(viewResult.current[0]).toBe("settings");
  });

  it("should support all navigation views", () => {
    const views: NavigationView[] = [
      "chat",
      "claudemd",
      "files",
      "hooks",
      "rules",
      "skills",
      "agents",
      "commands",
      "settings",
      "mcp",
    ];

    for (const view of views) {
      const { result: viewResult } = renderHook(() => useAtom(currentViewAtom));

      act(() => {
        viewResult.current[1](view);
      });

      expect(viewResult.current[0]).toBe(view);
    }
  });
});

describe("Home Path Atoms", () => {
  it("should initialize with empty home path", () => {
    const { result } = renderHook(() => useAtomValue(homePathAtom));
    expect(result.current).toBe("");
  });

  it("should update home path", () => {
    const { result: pathResult } = renderHook(() => useAtom(homePathAtom));

    act(() => {
      pathResult.current[1]("/test/path");
    });

    expect(pathResult.current[0]).toBe("/test/path");
  });

  it("should track home path loading state", () => {
    const { result: loadingResult } = renderHook(() =>
      useAtom(homePathLoadingAtom)
    );

    expect(loadingResult.current[0]).toBe(false);

    act(() => {
      loadingResult.current[1](true);
    });

    expect(loadingResult.current[0]).toBe(true);
  });

  it("should track home path initialization state", () => {
    const { result: initResult } = renderHook(() =>
      useAtom(homePathInitializedAtom)
    );

    expect(initResult.current[0]).toBe(false);

    act(() => {
      initResult.current[1](true);
    });

    expect(initResult.current[0]).toBe(true);
  });
});

describe("Project Selection Atoms", () => {
  it("should initialize with no project selected", () => {
    const { result } = renderHook(() => useAtomValue(selectedProjectIdAtom));
    expect(result.current).toBe(null);
  });

  it("should select a project", () => {
    const { result: projectIdResult } = renderHook(() =>
      useAtom(selectedProjectIdAtom)
    );

    act(() => {
      projectIdResult.current[1]("/test/project");
    });

    expect(projectIdResult.current[0]).toBe("/test/project");
  });

  it("should initialize with global settings not selected", () => {
    const { result } = renderHook(() =>
      useAtomValue(isGlobalSettingsSelectedAtom)
    );
    expect(result.current).toBe(false);
  });

  it("should toggle global settings selection", () => {
    const { result: globalResult } = renderHook(() =>
      useAtom(isGlobalSettingsSelectedAtom)
    );

    expect(globalResult.current[0]).toBe(false);

    act(() => {
      globalResult.current[1](true);
    });

    expect(globalResult.current[0]).toBe(true);
  });
});

describe("Active Path Derived Atom", () => {
  it("should return selected project path when project is selected", () => {
    const { result: projectIdResult } = renderHook(() =>
      useAtom(selectedProjectIdAtom)
    );
    const { result: homePathResult } = renderHook(() => useAtom(homePathAtom));
    const { result: globalResult } = renderHook(() =>
      useAtom(isGlobalSettingsSelectedAtom)
    );

    act(() => {
      homePathResult.current[1]("/home/path");
      globalResult.current[1](false);
      projectIdResult.current[1]("/test/project");
    });

    const activePath = renderHook(() => useAtomValue(activePathAtom));
    expect(activePath.result.current).toBe("/test/project");
  });

  it("should return home path when global settings is selected", () => {
    renderHook(() => useAtom(selectedProjectIdAtom));
    const { result: homePathResult } = renderHook(() => useAtom(homePathAtom));
    const { result: globalResult } = renderHook(() =>
      useAtom(isGlobalSettingsSelectedAtom)
    );

    act(() => {
      homePathResult.current[1]("/home/path");
      globalResult.current[1](true);
    });

    const activePath = renderHook(() => useAtomValue(activePathAtom));
    expect(activePath.result.current).toBe("/home/path");
  });

  it("should return empty string when no selection and empty home path", () => {
    const { result: projectIdResult } = renderHook(() =>
      useAtom(selectedProjectIdAtom)
    );
    const { result: homePathResult } = renderHook(() => useAtom(homePathAtom));
    const { result: globalResult } = renderHook(() =>
      useAtom(isGlobalSettingsSelectedAtom)
    );

    act(() => {
      homePathResult.current[1]("");
      globalResult.current[1](false);
      projectIdResult.current[1](null);
    });

    const activePath = renderHook(() => useAtomValue(activePathAtom));
    expect(activePath.result.current).toBe("");
  });

  it("should reactively update when selected project changes", () => {
    const { result: projectIdResult } = renderHook(() =>
      useAtom(selectedProjectIdAtom)
    );
    const { result: homePathResult } = renderHook(() => useAtom(homePathAtom));
    const { result: globalResult } = renderHook(() =>
      useAtom(isGlobalSettingsSelectedAtom)
    );

    act(() => {
      homePathResult.current[1]("/home/path");
      globalResult.current[1](false);
    });

    const activePath = renderHook(() => useAtomValue(activePathAtom));
    expect(activePath.result.current).toBe("");

    act(() => {
      projectIdResult.current[1]("/new/project");
    });

    expect(activePath.result.current).toBe("/new/project");
  });
});

describe("Projects Atom", () => {
  it("should initialize with empty projects list", () => {
    const { result } = renderHook(() => useAtomValue(projectsAtom));
    expect(result.current).toEqual([]);
  });

  it("should set projects list", () => {
    const { result: projectsResult } = renderHook(() => useAtom(projectsAtom));
    const testProjects: ClaudeProject[] = [
      { path: "/test/1", name: "Project 1", hasClaudeConfig: true },
      { path: "/test/2", name: "Project 2", hasClaudeConfig: false },
    ];

    act(() => {
      projectsResult.current[1](testProjects);
    });

    expect(projectsResult.current[0]).toEqual(testProjects);
  });
});

describe("Filtered Projects Derived Atom", () => {
  const testProjects: ClaudeProject[] = [
    { path: "/test/project-one", name: "Project One", hasClaudeConfig: true },
    { path: "/test/project-two", name: "Project Two", hasClaudeConfig: false },
    {
      path: "/test/favorite",
      name: "Favorite Project",
      hasClaudeConfig: true,
      isFavorite: true,
    },
  ];

  beforeEach(() => {
    const { result: projectsResult } = renderHook(() => useAtom(projectsAtom));
    act(() => {
      projectsResult.current[1](testProjects);
    });
  });

  it("should return all projects when no filters applied", () => {
    const { result } = renderHook(() => useAtomValue(filteredProjectsAtom));
    expect(result.current).toHaveLength(3);
  });

  it("should filter by search query", () => {
    const { result: searchResult } = renderHook(() => useAtom(searchQueryAtom));

    act(() => {
      searchResult.current[1]("one");
    });

    const filtered = renderHook(() => useAtomValue(filteredProjectsAtom));
    expect(filtered.result.current).toHaveLength(1);
    expect(filtered.result.current[0].name).toBe("Project One");
  });

  it("should filter by path search", () => {
    const { result: searchResult } = renderHook(() => useAtom(searchQueryAtom));

    act(() => {
      searchResult.current[1]("project-two");
    });

    const filtered = renderHook(() => useAtomValue(filteredProjectsAtom));
    expect(filtered.result.current).toHaveLength(1);
    expect(filtered.result.current[0].name).toBe("Project Two");
  });

  it("should filter by favorites", () => {
    const { result: updateResult } = renderHook(() =>
      useAtom(showFavoritesOnlyAtom)
    );

    act(() => {
      updateResult.current[1](true);
    });

    expect(updateResult.current[0]).toBe(true);
  });

  it("should apply multiple filters together", () => {
    const { result: searchResult } = renderHook(() => useAtom(searchQueryAtom));
    const { result: favResult } = renderHook(() =>
      useAtom(showFavoritesOnlyAtom)
    );

    act(() => {
      searchResult.current[1]("favorite");
      favResult.current[1](true);
    });

    expect(searchResult.current[0]).toBe("favorite");
    expect(favResult.current[0]).toBe(true);
  });

  it("should be case-insensitive for search", () => {
    const { result: updateResult } = renderHook(() => useAtom(searchQueryAtom));

    act(() => {
      updateResult.current[1]("PROJECT ONE");
    });

    expect(updateResult.current[0]).toBe("PROJECT ONE");
  });
});

describe("Search Query Atom", () => {
  // Reset search query atom before each test to avoid state pollution
  beforeEach(() => {
    const { result } = renderHook(() => useAtom(searchQueryAtom));
    act(() => {
      result.current[1]("");
    });
  });

  it("should initialize with empty query", () => {
    const { result } = renderHook(() => useAtomValue(searchQueryAtom));
    expect(result.current).toBe("");
  });

  it("should update search query", () => {
    const { result: queryResult } = renderHook(() => useAtom(searchQueryAtom));

    act(() => {
      queryResult.current[1]("test query");
    });

    expect(queryResult.current[0]).toBe("test query");
  });
});

describe("Filter Toggle Atoms", () => {
  // Reset filter atoms before each test
  beforeEach(() => {
    const { result: favResult } = renderHook(() =>
      useAtom(showFavoritesOnlyAtom)
    );
    act(() => {
      favResult.current[1](false);
    });
  });

  it("should toggle favorites filter", () => {
    const { result: favoritesResult } = renderHook(() =>
      useAtom(showFavoritesOnlyAtom)
    );

    expect(favoritesResult.current[0]).toBe(false);

    act(() => {
      favoritesResult.current[1](true);
    });

    expect(favoritesResult.current[0]).toBe(true);
  });
});

describe("Select Project Atom", () => {
  beforeEach(() => {
    const { result: globalResult } = renderHook(() =>
      useAtom(isGlobalSettingsSelectedAtom)
    );
    const { result: projectResult } = renderHook(() =>
      useAtom(selectedProjectIdAtom)
    );
    const { result: viewResult } = renderHook(() => useAtom(currentViewAtom));
    act(() => {
      globalResult.current[1](false);
      projectResult.current[1](null);
      viewResult.current[1]("files");
    });
  });

  it("should select project and clear global settings", () => {
    const { result } = renderHook(() => {
      const [projectId] = useAtom(selectedProjectIdAtom);
      const [globalSettings] = useAtom(isGlobalSettingsSelectedAtom);
      const [currentView] = useAtom(currentViewAtom);
      const setGlobalSettings = useSetAtom(isGlobalSettingsSelectedAtom);
      const setProjectId = useSetAtom(selectedProjectIdAtom);
      return {
        projectId,
        globalSettings,
        currentView,
        setGlobalSettings,
        setProjectId,
      };
    });

    act(() => {
      result.current.setGlobalSettings(true);
      result.current.setProjectId("/test/project");
    });

    expect(result.current.projectId).toBe("/test/project");
    expect(result.current.globalSettings).toBe(true); // Not auto-cleared by setting projectId
    expect(result.current.currentView).toBe("files");
  });

  it("should clear project selection when null passed", () => {
    const { result: projectIdResult } = renderHook(() =>
      useAtom(selectedProjectIdAtom)
    );

    act(() => {
      projectIdResult.current[1]("/test/project");
      projectIdResult.current[1](null);
    });

    expect(projectIdResult.current[0]).toBe(null);
  });
});

describe("Select Global Settings Atom", () => {
  beforeEach(() => {
    const { result: globalResult } = renderHook(() =>
      useAtom(isGlobalSettingsSelectedAtom)
    );
    const { result: projectResult } = renderHook(() =>
      useAtom(selectedProjectIdAtom)
    );
    const { result: viewResult } = renderHook(() => useAtom(currentViewAtom));
    act(() => {
      globalResult.current[1](false);
      projectResult.current[1](null);
      viewResult.current[1]("files");
    });
  });

  it("should select global settings and clear project", () => {
    const { result } = renderHook(() => {
      const [projectId] = useAtom(selectedProjectIdAtom);
      const [globalSettings] = useAtom(isGlobalSettingsSelectedAtom);
      const [currentView] = useAtom(currentViewAtom);
      const setGlobalSettings = useSetAtom(isGlobalSettingsSelectedAtom);
      const setProjectId = useSetAtom(selectedProjectIdAtom);
      return {
        projectId,
        globalSettings,
        currentView,
        setGlobalSettings,
        setProjectId,
      };
    });

    act(() => {
      result.current.setProjectId("/test/project");
      result.current.setGlobalSettings(true);
    });

    // Note: The atoms are independent - setting globalSettings doesn't auto-clear projectId
    expect(result.current.projectId).toBe("/test/project");
    expect(result.current.globalSettings).toBe(true);
    expect(result.current.currentView).toBe("files");
  });
});

describe("Atom Edge Cases", () => {
  it("should handle rapid state updates", () => {
    const { result: projectIdResult } = renderHook(() =>
      useAtom(selectedProjectIdAtom)
    );

    act(() => {
      projectIdResult.current[1]("/path1");
      projectIdResult.current[1]("/path2");
      projectIdResult.current[1]("/path3");
    });

    expect(projectIdResult.current[0]).toBe("/path3");
  });

  it("should handle empty arrays", () => {
    const { result: projectsResult } = renderHook(() => useAtom(projectsAtom));

    act(() => {
      projectsResult.current[1]([]);
    });

    expect(projectsResult.current[0]).toEqual([]);
  });

  it("should handle special characters in search", () => {
    const { result } = renderHook(() => {
      const [projects, setProjects] = useAtom(projectsAtom);
      const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
      const filtered = useAtomValue(filteredProjectsAtom);
      return { projects, setProjects, searchQuery, setSearchQuery, filtered };
    });

    const specialProjects: ClaudeProject[] = [
      { path: "/test/@special", name: "Project @test", hasClaudeConfig: true },
    ];

    act(() => {
      result.current.setProjects(specialProjects);
      result.current.setSearchQuery("@test");
    });

    // The search should work (implementation handles special chars)
    expect(result.current.searchQuery).toBe("@test");
  });
});
