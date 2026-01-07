import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { app } from "electron";
import type { ClaudeProject } from "./scanner";

export interface CacheData {
  projects: ClaudeProject[];
  timestamp: number;
  version: string;
}

const CACHE_VERSION = "1.0";
const CACHE_FILENAME = "project-cache.json";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour in milliseconds

/**
 * Get the cache file path
 */
function getCachePath(): string {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, CACHE_FILENAME);
}

/**
 * Load cached projects from disk
 */
export async function loadCachedProjects(): Promise<ClaudeProject[] | null> {
  try {
    const cachePath = getCachePath();
    const data = await readFile(cachePath, "utf-8");
    const cache: CacheData = JSON.parse(data);

    // Check cache version
    if (cache.version !== CACHE_VERSION) {
      return null;
    }

    // Check cache age
    const cacheAge = Date.now() - cache.timestamp;
    if (cacheAge > CACHE_TTL) {
      return null;
    }

    return cache.projects;
  } catch {
    // Cache doesn't exist or is invalid
    return null;
  }
}

/**
 * Save projects to cache
 */
export async function saveProjectsToCache(
  projects: ClaudeProject[]
): Promise<void> {
  try {
    const userDataPath = app.getPath("userData");
    await mkdir(userDataPath, { recursive: true });

    const cachePath = getCachePath();
    const cache: CacheData = {
      projects,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    await writeFile(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error("Failed to save project cache:", error);
  }
}

/**
 * Clear the project cache
 */
export async function clearProjectCache(): Promise<void> {
  try {
    const cachePath = getCachePath();
    await writeFile(
      cachePath,
      JSON.stringify({
        projects: [],
        timestamp: 0,
        version: CACHE_VERSION,
      })
    );
  } catch (error) {
    console.error("Failed to clear project cache:", error);
  }
}

/**
 * Get cache timestamp
 */
export async function getCacheTimestamp(): Promise<number | null> {
  try {
    const cachePath = getCachePath();
    const data = await readFile(cachePath, "utf-8");
    const cache: CacheData = JSON.parse(data);
    return cache.timestamp;
  } catch {
    return null;
  }
}

/**
 * Check if cache is valid (exists and not expired)
 */
export async function isCacheValid(): Promise<boolean> {
  try {
    const cachePath = getCachePath();
    const data = await readFile(cachePath, "utf-8");
    const cache: CacheData = JSON.parse(data);

    // Check version
    if (cache.version !== CACHE_VERSION) {
      return false;
    }

    // Check age
    const cacheAge = Date.now() - cache.timestamp;
    return cacheAge <= CACHE_TTL;
  } catch {
    return false;
  }
}
