import { os } from "@orpc/server";
import {
  getDefaultScanPaths,
  type ScanOptions,
  scanForProjects,
  scanMultipleDirectories,
} from "../../main/scanner";
import {
  isCacheValid,
  loadCachedProjects,
  saveProjectsToCache,
} from "../../main/scanner/cache";

/**
 * Scan for Claude projects
 */
export const scanProjects = os.handler(async () => {
  const defaultPaths = getDefaultScanPaths();
  const result = await scanMultipleDirectories(defaultPaths);

  // Save to cache for next time
  await saveProjectsToCache(result.projects);

  return result;
});

/**
 * Scan a specific directory
 */
export const scanDirectory = os.handler(async (opt) => {
  const { input } = opt as { input: { path: string; options?: ScanOptions } };
  const result = await scanForProjects(input.path, input.options);
  return result;
});

/**
 * Get cached projects if available
 */
export const getCachedProjects = os.handler(async () => {
  const valid = await isCacheValid();

  if (!valid) {
    return { projects: [], fromCache: false };
  }

  const projects = await loadCachedProjects();
  return {
    projects: projects || [],
    fromCache: true,
  };
});

/**
 * Get default scan paths for the current platform
 */
export const getDefaultPaths = os.handler(() => {
  return getDefaultScanPaths();
});

/**
 * Clear the project cache
 */
export const clearCache = os.handler(async () => {
  const { clearProjectCache } = await import("../../main/scanner/cache");
  await clearProjectCache();
  return { success: true };
});

/**
 * Check if cache is valid
 */
export const checkCacheValid = os.handler(async () => {
  return await isCacheValid();
});
