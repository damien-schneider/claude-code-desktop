import { access, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";

export interface ClaudeProject {
  path: string;
  name: string;
  hasClaudeConfig: boolean;
  isFavorite?: boolean;
  lastModified?: Date;
}

export interface ScanOptions {
  maxDepth?: number;
  excludePaths?: string[];
  includeHidden?: boolean;
}

export interface ScanResult {
  projects: ClaudeProject[];
  scanned: number;
  errors: string[];
}

/**
 * Check if a directory exists and is accessible
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath);
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists and is accessible
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a directory contains a .git subdirectory
 */
function isGitRepository(dirPath: string): Promise<boolean> {
  const gitPath = join(dirPath, ".git");
  return directoryExists(gitPath);
}

/**
 * Check if a directory contains a .claude subdirectory or a CLAUDE.md file
 */
async function hasClaudeConfig(dirPath: string): Promise<boolean> {
  const claudeDirPath = join(dirPath, ".claude");
  const claudeMdPath = join(dirPath, "CLAUDE.md");

  const [hasDir, hasFile] = await Promise.all([
    directoryExists(claudeDirPath),
    fileExists(claudeMdPath),
  ]);

  return hasDir || hasFile;
}

/**
 * Default paths to exclude from scanning
 */
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

/**
 * Check if a path should be excluded
 */
function shouldExclude(path: string, excludePaths: string[]): boolean {
  const baseName = basename(path);
  return excludePaths.some(
    (exclude) => path.includes(exclude) || baseName === exclude
  );
}

/**
 * Recursively scan a directory for git repositories
 */
async function scanDirectory(
  dirPath: string,
  currentDepth: number,
  options: ScanOptions,
  result: ScanResult
): Promise<void> {
  const {
    maxDepth = 10,
    excludePaths = DEFAULT_EXCLUDE_PATHS,
    includeHidden = false,
  } = options;

  // Check depth limit
  if (currentDepth > maxDepth) {
    return;
  }

  // Skip excluded paths
  if (shouldExclude(dirPath, excludePaths)) {
    return;
  }

  // Skip hidden directories unless explicitly included
  if (!includeHidden && basename(dirPath).startsWith(".")) {
    return;
  }

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    // Check if current directory is a git repository
    if (await isGitRepository(dirPath)) {
      const hasClaude = await hasClaudeConfig(dirPath);
      const stats = await stat(dirPath);

      result.projects.push({
        path: dirPath,
        name: basename(dirPath),
        hasClaudeConfig: hasClaude,
        lastModified: stats.mtime,
      });

      // Don't scan inside git repositories
      return;
    }

    // Recursively scan subdirectories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = join(dirPath, entry.name);
        await scanDirectory(fullPath, currentDepth + 1, options, result);
      }
    }

    result.scanned++;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`${dirPath}: ${errorMessage}`);
  }
}

/**
 * Scan for git repositories starting from the user's home directory
 */
export async function scanForProjects(
  startPath: string = homedir(),
  options: ScanOptions = {}
): Promise<ScanResult> {
  const result: ScanResult = {
    projects: [],
    scanned: 0,
    errors: [],
  };

  await scanDirectory(startPath, 0, options, result);

  return result;
}

/**
 * Scan multiple directories in parallel
 */
export async function scanMultipleDirectories(
  directories: string[],
  options: ScanOptions = {}
): Promise<ScanResult> {
  const results = await Promise.all(
    directories.map((dir) => scanForProjects(dir, options))
  );

  return results.reduce(
    (combined, current) => ({
      projects: [...combined.projects, ...current.projects],
      scanned: combined.scanned + current.scanned,
      errors: [...combined.errors, ...current.errors],
    }),
    { projects: [], scanned: 0, errors: [] }
  );
}

/**
 * Get common project root directories for the current platform
 */
export function getDefaultScanPaths(): string[] {
  const platform = process.platform;
  const home = homedir();

  if (platform === "darwin") {
    // macOS: Scan home directory, exclude system paths
    return [home];
  }
  if (platform === "win32") {
    // Windows: Scan user profile and common project locations
    return [
      home,
      join(home, "source"),
      join(home, "projects"),
      join(home, "code"),
    ];
  }
  // Linux: Scan home directory
  return [home];
}
