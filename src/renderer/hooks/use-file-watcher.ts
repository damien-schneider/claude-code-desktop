/**
 * File watcher hook for hot-reloading skills and other watched files.
 *
 * TODO: Implement actual file watching via IPC to main process.
 * Currently returns a stub that reports not watching.
 */

interface FileWatcherEvent {
  action: "add" | "change" | "delete";
  path: string;
}

interface UseFileWatcherOptions {
  projectPath?: string;
  watchHome?: boolean;
  enabled?: boolean;
  onSkillChange?: (event: FileWatcherEvent) => Promise<void>;
}

interface UseFileWatcherResult {
  isWatching: boolean;
}

/**
 * Hook for watching file changes.
 * Currently a stub - file watching is not yet implemented.
 */
export function useFileWatcher(
  _options: UseFileWatcherOptions
): UseFileWatcherResult {
  // TODO: Implement file watching via IPC
  // This would require:
  // 1. An IPC handler in src/ipc/file-watcher/ that uses chokidar or similar
  // 2. Subscribing to file change events from the main process
  // 3. Calling the appropriate callbacks when files change

  return {
    isWatching: false,
  };
}
