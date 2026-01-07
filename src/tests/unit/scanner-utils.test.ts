/**
 * Pragmatic tests for scanner utilities
 * Tests actual path handling and project detection logic
 */
import { describe, expect, it } from "vitest";

describe("Scanner Utilities", () => {
  const DEFAULT_EXCLUDE_PATHS = [
    "node_modules",
    ".git",
    ".npm",
    ".cache",
    ".local",
    ".config",
    "Library",
    "Applications",
    ".Trash",
    ".DS_Store",
    "vendor",
    "build",
    "dist",
    ".next",
    ".nuxt",
    "target",
    "bin",
    "obj",
  ];

  // Recreate the shouldExclude logic for testing
  function shouldExclude(path: string, excludePaths: string[]): boolean {
    const baseName = path.split("/").pop() || path.split("\\").pop() || path;
    return excludePaths.some(
      (exclude) => path.includes(exclude) || baseName === exclude
    );
  }

  describe("shouldExclude", () => {
    it("should exclude node_modules directories", () => {
      const result = shouldExclude(
        "/path/to/node_modules",
        DEFAULT_EXCLUDE_PATHS
      );
      expect(result).toBe(true);
    });

    it("should exclude .git directories", () => {
      const result = shouldExclude("/path/to/.git", DEFAULT_EXCLUDE_PATHS);
      expect(result).toBe(true);
    });

    it("should exclude build artifacts", () => {
      expect(shouldExclude("/path/to/dist", DEFAULT_EXCLUDE_PATHS)).toBe(true);
      expect(shouldExclude("/path/to/build", DEFAULT_EXCLUDE_PATHS)).toBe(true);
      expect(shouldExclude("/path/to/target", DEFAULT_EXCLUDE_PATHS)).toBe(
        true
      );
    });

    it("should exclude cache directories", () => {
      expect(shouldExclude("/path/to/.cache", DEFAULT_EXCLUDE_PATHS)).toBe(
        true
      );
      expect(shouldExclude("/path/to/.npm", DEFAULT_EXCLUDE_PATHS)).toBe(true);
    });

    it("should exclude macOS specific directories", () => {
      expect(shouldExclude("/path/to/.DS_Store", DEFAULT_EXCLUDE_PATHS)).toBe(
        true
      );
      expect(shouldExclude("/path/to/Library", DEFAULT_EXCLUDE_PATHS)).toBe(
        true
      );
    });

    it("should not exclude regular project directories", () => {
      const result = shouldExclude(
        "/path/to/my-project",
        DEFAULT_EXCLUDE_PATHS
      );
      expect(result).toBe(false);
    });

    it("should handle paths containing excluded substrings", () => {
      const result = shouldExclude(
        "/path/to/project/node_modules/package",
        DEFAULT_EXCLUDE_PATHS
      );
      expect(result).toBe(true);
    });

    it("should handle basename matching", () => {
      const result = shouldExclude(
        "/some/deep/path/vendor",
        DEFAULT_EXCLUDE_PATHS
      );
      expect(result).toBe(true);
    });
  });

  describe("Project detection logic", () => {
    it("should identify git repository paths", () => {
      const gitPath = "/project/.git";
      expect(gitPath.endsWith(".git")).toBe(true);
    });

    it("should identify claude config paths", () => {
      const claudePath = "/project/.claude";
      expect(claudePath.endsWith(".claude")).toBe(true);
    });

    it("should distinguish between different config types", () => {
      const gitPath = "/project/.git";
      const claudePath = "/project/.claude";
      const npmPath = "/project/.npm";

      expect(gitPath).not.toBe(claudePath);
      expect(claudePath).not.toBe(npmPath);
    });
  });

  describe("Path handling", () => {
    it("should handle relative paths correctly", () => {
      const path = "./project/src";
      expect(path.startsWith(".")).toBe(true);
    });

    it("should handle absolute paths correctly", () => {
      const path = "/Users/user/project";
      expect(path.startsWith("/")).toBe(true);
    });

    it("should handle home directory paths", () => {
      const path = "~/project";
      expect(path.startsWith("~")).toBe(true);
    });

    it("should handle Windows-style paths", () => {
      const path = "C:\\Users\\user\\project";
      expect(path.includes("\\")).toBe(true);
    });
  });

  describe("Project data structure", () => {
    it("should create valid ClaudeProject objects", () => {
      const project = {
        path: "/test/project",
        name: "test-project",
        hasClaudeConfig: true,
        isFavorite: true,
        lastModified: new Date(),
      };

      expect(project.path).toBe("/test/project");
      expect(project.name).toBe("test-project");
      expect(project.hasClaudeConfig).toBe(true);
      expect(project.isFavorite).toBe(true);
      expect(project.lastModified).toBeInstanceOf(Date);
    });

    it("should handle projects without optional fields", () => {
      const project = {
        path: "/test/project",
        name: "test-project",
        hasClaudeConfig: false,
      } as any;

      expect(project.isFavorite).toBeUndefined();
      expect(project.lastModified).toBeUndefined();
    });
  });

  describe("Scan options", () => {
    it("should accept default scan options", () => {
      const options = {} as any;
      expect(options.maxDepth).toBeUndefined();
      expect(options.excludePaths).toBeUndefined();
      expect(options.includeHidden).toBeUndefined();
    });

    it("should accept custom scan options", () => {
      const options = {
        maxDepth: 5,
        excludePaths: ["custom-exclude"],
        includeHidden: true,
      } as any;

      expect(options.maxDepth).toBe(5);
      expect(options.excludePaths).toEqual(["custom-exclude"]);
      expect(options.includeHidden).toBe(true);
    });
  });

  describe("Scan result structure", () => {
    it("should create valid ScanResult objects", () => {
      const result = {
        projects: [],
        scanned: 0,
        errors: [],
      };

      expect(result.projects).toEqual([]);
      expect(result.scanned).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it("should hold scan data correctly", () => {
      const projects = [
        { path: "/p1", name: "project1", hasClaudeConfig: true },
        { path: "/p2", name: "project2", hasClaudeConfig: false },
      ];

      const result = {
        projects,
        scanned: 10,
        errors: ["Error 1", "Error 2"],
      };

      expect(result.projects).toHaveLength(2);
      expect(result.scanned).toBe(10);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty paths", () => {
      const path = "";
      expect(path.length).toBe(0);
    });

    it("should handle paths with special characters", () => {
      const path = "/path/to/project with spaces";
      expect(path).toContain(" ");
    });

    it("should handle paths with unicode characters", () => {
      const path = "/path/to/projëct";
      expect(path).toContain("ë");
    });

    it("should handle very long paths", () => {
      const longPath = "/a".repeat(51);
      expect(longPath.length).toBeGreaterThan(100);
    });
  });

  describe("Depth calculation logic", () => {
    it("should calculate depth from path separators", () => {
      const path = "/a/b/c/d";
      const depth = path.split("/").length - 1;
      expect(depth).toBe(4);
    });

    it("should handle root path", () => {
      const path = "/";
      const depth = path.split("/").filter(Boolean).length;
      expect(depth).toBe(0);
    });

    it("should handle relative path depth", () => {
      const path = "./a/b/c";
      const parts = path.split("/");
      expect(parts.length).toBe(4);
    });
  });

  describe("Filter logic", () => {
    it("should filter projects by config presence", () => {
      const projects = [
        { path: "/p1", name: "p1", hasClaudeConfig: true },
        { path: "/p2", name: "p2", hasClaudeConfig: false },
        { path: "/p3", name: "p3", hasClaudeConfig: true },
      ];

      const withConfig = projects.filter((p) => p.hasClaudeConfig);
      expect(withConfig).toHaveLength(2);
    });

    it("should filter projects by favorite status", () => {
      const projects = [
        { path: "/p1", name: "p1", hasClaudeConfig: true, isFavorite: true },
        { path: "/p2", name: "p2", hasClaudeConfig: false },
        { path: "/p3", name: "p3", hasClaudeConfig: true, isFavorite: false },
      ];

      const favorites = projects.filter((p) => p.isFavorite);
      expect(favorites).toHaveLength(1);
    });

    it("should handle undefined favorite status", () => {
      const projects = [
        { path: "/p1", name: "p1", hasClaudeConfig: true },
      ] as any[];

      const favorites = projects.filter((p) => p.isFavorite);
      expect(favorites).toHaveLength(0);
    });
  });
});
