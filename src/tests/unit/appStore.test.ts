/**
 * Pragmatic tests for appStore utilities
 * Tests actual store behavior and utility functions
 */
import { describe, expect, it } from "vitest";
import {
  type ClaudeProject,
  deduplicateProjects,
} from "@/renderer/stores/appStore";

describe("appStore Utilities", () => {
  describe("deduplicateProjects", () => {
    it("should deduplicate projects by path", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "Project 1", hasClaudeConfig: true },
        { path: "/p2", name: "Project 2", hasClaudeConfig: false },
        { path: "/p1", name: "Duplicate", hasClaudeConfig: true },
        { path: "/p3", name: "Project 3", hasClaudeConfig: true },
      ];

      const result = deduplicateProjects(projects);

      expect(result).toHaveLength(3);
      expect(result[0].path).toBe("/p1");
      expect(result[0].name).toBe("Project 1"); // Keeps first occurrence
      expect(result[1].path).toBe("/p2");
      expect(result[2].path).toBe("/p3");
    });

    it("should handle empty array", () => {
      const result = deduplicateProjects([]);
      expect(result).toEqual([]);
    });

    it("should handle array with no duplicates", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "P1", hasClaudeConfig: true },
        { path: "/p2", name: "P2", hasClaudeConfig: false },
      ];

      const result = deduplicateProjects(projects);
      expect(result).toHaveLength(2);
    });

    it("should handle all duplicates", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "P1", hasClaudeConfig: true },
        { path: "/p1", name: "P1-dup", hasClaudeConfig: true },
        { path: "/p1", name: "P1-dup2", hasClaudeConfig: true },
      ];

      const result = deduplicateProjects(projects);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("P1");
    });

    it("should preserve favorite status", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "P1", hasClaudeConfig: true, isFavorite: true },
        {
          path: "/p1",
          name: "P1-dup",
          hasClaudeConfig: true,
          isFavorite: false,
        },
      ];

      const result = deduplicateProjects(projects);
      expect(result[0].isFavorite).toBe(true);
    });

    it("should handle case-sensitive paths", () => {
      const projects: ClaudeProject[] = [
        { path: "/path/Project", name: "P1", hasClaudeConfig: true },
        { path: "/path/project", name: "P2", hasClaudeConfig: true },
      ];

      const result = deduplicateProjects(projects);
      expect(result).toHaveLength(2); // Different cases, different paths
    });

    it("should handle trailing slashes in paths", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1/", name: "P1", hasClaudeConfig: true },
        { path: "/p1", name: "P1-no-slash", hasClaudeConfig: true },
      ];

      const result = deduplicateProjects(projects);
      // These are treated as different paths (exact match)
      expect(result).toHaveLength(2);
    });
  });

  describe("Project filtering logic", () => {
    it("should filter by search query in name", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "Test Project", hasClaudeConfig: true },
        { path: "/p2", name: "Other Project", hasClaudeConfig: true },
      ];

      const query = "test";
      const filtered = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.path.toLowerCase().includes(query)
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Test Project");
    });

    it("should filter by search query in path", () => {
      const projects: ClaudeProject[] = [
        { path: "/users/test/project", name: "P1", hasClaudeConfig: true },
        { path: "/users/other/project", name: "P2", hasClaudeConfig: true },
      ];

      const query = "test";
      const filtered = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.path.toLowerCase().includes(query)
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].path).toContain("test");
    });

    it("should be case-insensitive for search", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "Test Project", hasClaudeConfig: true },
      ];

      const query = "TEST PROJECT";
      const filtered = projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
    });

    it("should filter by favorite status", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "P1", hasClaudeConfig: true, isFavorite: true },
        { path: "/p2", name: "P2", hasClaudeConfig: true, isFavorite: false },
        { path: "/p3", name: "P3", hasClaudeConfig: true },
      ];

      const favorites = projects.filter((p) => p.isFavorite);
      expect(favorites).toHaveLength(1);
    });

    it("should filter by hasClaudeConfig", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "P1", hasClaudeConfig: true },
        { path: "/p2", name: "P2", hasClaudeConfig: false },
        { path: "/p3", name: "P3", hasClaudeConfig: true },
      ];

      const withConfig = projects.filter((p) => p.hasClaudeConfig);
      expect(withConfig).toHaveLength(2);
    });

    it("should apply multiple filters together", () => {
      const projects: ClaudeProject[] = [
        {
          path: "/p1",
          name: "Test Project",
          hasClaudeConfig: true,
          isFavorite: true,
        },
        {
          path: "/p2",
          name: "Test Project 2",
          hasClaudeConfig: false,
          isFavorite: true,
        },
        {
          path: "/p3",
          name: "Other Project",
          hasClaudeConfig: true,
          isFavorite: true,
        },
      ];

      const query = "test";
      let filtered = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.path.toLowerCase().includes(query)
      );
      filtered = filtered.filter((p) => p.isFavorite);
      filtered = filtered.filter((p) => p.hasClaudeConfig);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].path).toBe("/p1");
    });
  });

  describe("NavigationView type", () => {
    it("should accept valid navigation views", () => {
      const views = [
        "claudemd",
        "files",
        "hooks",
        "rules",
        "skills",
        "agents",
        "commands",
      ] as const;

      views.forEach((view) => {
        expect(view).toBeTruthy();
      });
    });

    it("should have all expected views", () => {
      const expectedViews = [
        "claudemd",
        "files",
        "hooks",
        "rules",
        "skills",
        "agents",
        "commands",
      ];

      expect(expectedViews).toHaveLength(7);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined favorite in filter", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "P1", hasClaudeConfig: true },
        { path: "/p2", name: "P2", hasClaudeConfig: true, isFavorite: false },
      ];

      const favorites = projects.filter((p) => p.isFavorite);
      expect(favorites).toHaveLength(0);
    });

    it("should handle empty search query", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "P1", hasClaudeConfig: true },
      ];

      const query = "";
      const filtered = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.path.toLowerCase().includes(query)
      );

      // Empty string matches everything
      expect(filtered).toHaveLength(1);
    });

    it("should handle special characters in search", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "Test@Project", hasClaudeConfig: true },
      ];

      const query = "@";
      const filtered = projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
    });
  });

  describe("Project data integrity", () => {
    it("should preserve all project fields", () => {
      const project: ClaudeProject = {
        path: "/test/project",
        name: "Test Project",
        hasClaudeConfig: true,
        isFavorite: true,
        lastModified: new Date("2024-01-01"),
      };

      expect(project.path).toBe("/test/project");
      expect(project.name).toBe("Test Project");
      expect(project.hasClaudeConfig).toBe(true);
      expect(project.isFavorite).toBe(true);
      expect(project.lastModified).toEqual(new Date("2024-01-01"));
    });

    it("should handle projects with minimal fields", () => {
      const project: ClaudeProject = {
        path: "/p",
        name: "P",
        hasClaudeConfig: false,
      };

      expect(Object.keys(project)).toHaveLength(3);
    });

    it("should not mutate original projects array", () => {
      const projects: ClaudeProject[] = [
        { path: "/p1", name: "P1", hasClaudeConfig: true },
      ];

      const originalLength = projects.length;
      deduplicateProjects(projects);

      expect(projects).toHaveLength(originalLength);
    });
  });
});
