import { describe, expect, it } from "vitest";
import { type ClaudeProject, deduplicateProjects } from "@/renderer/stores";

describe("scanner deduplication", () => {
  it("should deduplicate projects with the same path", () => {
    // Simulate the actual bug: the same project path appears twice
    const projectsWithDuplicates: ClaudeProject[] = [
      {
        path: "/Users/test/my-project",
        name: "my-project",
        hasClaudeConfig: true,
        isFavorite: false,
      },
      {
        path: "/Users/test/my-project", // Duplicate!
        name: "my-project",
        hasClaudeConfig: true,
        isFavorite: false,
      },
      {
        path: "/Users/test/other-project",
        name: "other-project",
        hasClaudeConfig: false,
        isFavorite: false,
      },
    ];

    const deduplicated = deduplicateProjects(projectsWithDuplicates);

    // Should only have 2 unique projects
    expect(deduplicated).toHaveLength(2);

    // All paths should be unique
    const paths = deduplicated.map((p) => p.path);
    const uniquePaths = new Set(paths);
    expect(paths.length).toBe(uniquePaths.size);

    // Verify the correct projects remain
    expect(deduplicated.map((p) => p.name)).toEqual([
      "my-project",
      "other-project",
    ]);
  });

  it("should handle empty project arrays", () => {
    expect(deduplicateProjects([])).toEqual([]);
  });
});
