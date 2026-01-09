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
