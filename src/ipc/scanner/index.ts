import {
  checkCacheValid,
  clearCache,
  getCachedProjects,
  getDefaultPaths,
  scanDirectory,
  scanProjects,
} from "./handlers";

export const scanner = {
  scanProjects,
  scanDirectory,
  getCachedProjects,
  getDefaultPaths,
  clearCache,
  checkCacheValid,
};
