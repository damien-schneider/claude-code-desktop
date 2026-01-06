import { os } from '@orpc/server';
import { z } from 'zod';
import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';
import {
  readDirectoryOptionsSchema,
  pathSchema,
  fileWriteSchema,
  directoryWriteSchema,
  settingsWriteSchema,
  createClaudeDirectorySchema,
} from './schemas';
import { readClaudeDirectory as readClaudeDir, type ClaudeFile as ClaudeFileInternal } from './directory-reader';

// Re-export types with the internal implementation
export interface ClaudeFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  category?: string;
}

export interface ClaudeDirectory {
  path: string;
  type: 'skills' | 'commands' | 'agents' | 'rules' | 'hooks';
  files: ClaudeFile[];
}

/**
 * Read a directory within a .claude folder
 * Uses the abstraction layer for consistent handling of different directory types
 */
export const readClaudeDirectory = os
  .input(z.object({
    projectPath: z.string(),
    type: z.enum(['skills', 'commands', 'agents', 'rules', 'hooks']),
  }))
  .handler(async ({ input: { projectPath, type } }) => {
    console.log('[IPC readClaudeDirectory] Reading', type, 'from', projectPath);
    const result = await readClaudeDir(projectPath, type);
    console.log('[IPC readClaudeDirectory] Got', result.files.length, 'files');

    // Log categories for debugging
    const categories = new Set(result.files.map((f) => f.category || 'none'));
    console.log('[IPC readClaudeDirectory] Categories:', Array.from(categories));

    // Convert internal types to export types
    const files: ClaudeFile[] = result.files.map((f) => ({
      name: f.name,
      path: f.path,
      type: f.type,
      content: f.content,
      category: f.category,
    }));

    return { path: result.path, type: result.type, files };
  }
);

/**
 * Read a specific file
 */
export const readClaudeFile = os
  .input(z.object({ filePath: z.string() }))
  .handler(async ({ input: { filePath } }) => {
    const content = await readFile(filePath, 'utf-8');
    return { path: filePath, content };
  });

/**
 * Write a file
 */
export const writeClaudeFile = os
  .input(z.object({ filePath: z.string(), content: z.string() }))
  .handler(async ({ input: { filePath, content } }) => {
    await writeFile(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  });

/**
 * Generate default content for a new Claude item
 */
function generateDefaultContent(type: string, name: string): string {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');

  switch (type) {
    case 'skills':
      return `---
name: ${normalizedName}
description: Description of what this skill does and when to use it
---

# ${name}

## When to use this skill
- Describe when Claude should use this skill

## Instructions
Add your skill instructions here.
`;

    case 'commands':
      return `---
description: Description of what this command does
---

# ${name}

$ARGUMENTS

Add your command instructions here.
`;

    case 'agents':
      return `---
name: ${normalizedName}
description: Description of what this agent does and when to delegate to it
instructions: Additional context for the agent
model: opus
color: blue
---

# ${name}

You are a specialist agent for...

## Instructions

Add your agent instructions here.
`;

    case 'rules':
      return `# ${name}

## When this rule applies
- Describe when Claude should follow this rule

## The rule
- Add specific instructions
`;

    case 'hooks':
      return `{
  "description": "Description of what this hook does",
  "enabled": true,
  "hookType": "user-message",
  "script": "// Hook script\\nconsole.log('Hook executed:', context);"
}`;

    default:
      return '';
  }
}

/**
 * Get the file path and name for a new Claude item
 */
function getItemPath(projectPath: string, type: string, name: string): { filePath: string; dirPath?: string } {
  const typeDir = join(projectPath, '.claude', type);

  switch (type) {
    case 'skills':
      // Skills are directories with SKILL.md inside
      const skillDir = join(typeDir, name);
      return { filePath: join(skillDir, 'SKILL.md'), dirPath: skillDir };

    case 'commands':
      // Commands are files in subdirectories or root
      const cmdPath = join(typeDir, `${name}.md`);
      return { filePath: cmdPath, dirPath: join(cmdPath, '..') };

    case 'agents':
      // Agents are flat .md files
      return { filePath: join(typeDir, `${name}.md`), dirPath: typeDir };

    case 'rules':
      // Rules are flat .md files
      return { filePath: join(typeDir, `${name}.md`), dirPath: typeDir };

    case 'hooks':
      // Hooks are flat .json files
      return { filePath: join(typeDir, `${name}.json`), dirPath: typeDir };

    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

/**
 * Create a new Claude item (skill, agent, rule, hook, command)
 * Handles both directory-based items (skills) and file-based items (agents, rules, hooks)
 */
export const createClaudeItem = os
  .input(z.object({
    projectPath: z.string(),
    type: z.enum(['skills', 'commands', 'agents', 'rules', 'hooks']),
    name: z.string().optional(),
  }))
  .handler(async ({ input: { projectPath, type, name } }) => {
    // Use default name if none provided
    const itemName = name || getDefaultName(type);
    const { filePath, dirPath } = getItemPath(projectPath, type, itemName);

    console.log('[IPC createClaudeItem] Creating:', { type, name: itemName, filePath });

    // Create directory if needed
    if (dirPath) {
      await mkdir(dirPath, { recursive: true });
    }

    // Generate and write default content
    const content = generateDefaultContent(type, itemName);
    await writeFile(filePath, content, 'utf-8');

    return { success: true, path: filePath, name: itemName };
  });

/**
 * Get default name for a new item
 */
function getDefaultName(type: string): string {
  const timestamp = Date.now().toString(36);
  switch (type) {
    case 'skills':
      return `new-skill-${timestamp}`;
    case 'commands':
      return `new-command-${timestamp}`;
    case 'agents':
      return `new-agent-${timestamp}`;
    case 'rules':
      return `new-rule-${timestamp}`;
    case 'hooks':
      return `new-hook-${timestamp}`;
    default:
      return `new-${type}-${timestamp}`;
  }
}

/**
 * @deprecated Use createClaudeItem instead
 * Create a directory (kept for backward compatibility)
 */
export const createClaudeDirectory = os
  .input(z.object({
    projectPath: z.string(),
    type: z.enum(['skills', 'commands', 'agents', 'rules', 'hooks']),
    name: z.string(),
  }))
  .handler(async ({ input: { projectPath, type, name } }) => {
    // Use the same logic as createClaudeItem
    const itemName = name;
    const { filePath, dirPath } = getItemPath(projectPath, type, itemName);

    console.log('[IPC createClaudeDirectory] Creating:', { type, name: itemName, filePath });

    // Create directory if needed
    if (dirPath) {
      await mkdir(dirPath, { recursive: true });
    }

    // Generate and write default content
    const content = generateDefaultContent(type, itemName);
    await writeFile(filePath, content, 'utf-8');

    return { success: true, path: filePath, name: itemName };
  });

/**
 * Delete a file or directory
 */
export const deleteClaudeItem = os
  .input(z.object({ itemPath: z.string() }))
  .handler(async ({ input: { itemPath } }) => {
    // Handle recursively
    const { rm } = await import('fs/promises');
    await rm(itemPath, { recursive: true, force: true });
    return { success: true, path: itemPath };
  });

/**
 * Get CLAUDE.md content if exists
 */
export const getCLAUDEMD = os
  .input(z.object({ projectPath: z.string() }))
  .handler(async ({ input: { projectPath } }) => {
    console.log('[IPC] getCLAUDEMD called with path:', projectPath);
    const paths = [
      join(projectPath, 'CLAUDE.md'),
      join(projectPath, '.claude', 'CLAUDE.md'),
    ];

    console.log('[IPC] Trying paths:', paths);

    for (const path of paths) {
      try {
        console.log('[IPC] Attempting to read:', path);
        const content = await readFile(path, 'utf-8');
        console.log('[IPC] Successfully read file, content length:', content.length);
        return { path, content, exists: true };
      } catch (error) {
        console.log('[IPC] Failed to read', path, ':', (error as Error).message);
        // Try next path
      }
    }

    console.log('[IPC] No CLAUDE.md found in any location');
    return { path: paths[0], content: '', exists: false };
  });

/**
 * Write CLAUDE.md
 */
export const writeCLAUDEMD = os
  .input(z.object({ projectPath: z.string(), content: z.string() }))
  .handler(async ({ input: { projectPath, content } }) => {
    const path = join(projectPath, '.claude', 'CLAUDE.md');
    await mkdir(join(projectPath, '.claude'), { recursive: true });
    await writeFile(path, content, 'utf-8');
    return { success: true, path };
  });

/**
 * Get settings.json content
 */
export const getSettings = os
  .input(z.object({ projectPath: z.string() }))
  .handler(async ({ input: { projectPath } }) => {
    const paths = [
      join(projectPath, '.claude', 'settings.json'),
    ];

    for (const path of paths) {
      try {
        const content = await readFile(path, 'utf-8');
        return { path, content, exists: true };
      } catch {
        // Try next path
      }
    }

    // Return default settings
    const defaultSettings = {
      allowedTools: [],
      modelPreferences: {},
    };
    return { path: paths[0], content: JSON.stringify(defaultSettings, null, 2), exists: false };
  });

/**
 * Write settings.json
 */
export const writeSettings = os
  .input(z.object({ projectPath: z.string(), content: z.string() }))
  .handler(async ({ input: { projectPath, content } }) => {
    const path = join(projectPath, '.claude', 'settings.json');
    await mkdir(join(projectPath, '.claude'), { recursive: true });

    // Validate JSON
    JSON.parse(content);

    await writeFile(path, content, 'utf-8');
    return { success: true, path };
  });

/**
 * File Explorer Types
 */
export interface ExplorerItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
}

export interface ExplorerDirectory {
  path: string;
  items: ExplorerItem[];
}

/**
 * Read a directory for file explorer
 */
export const readDirectory = os
  .input(z.object({
    dirPath: z.string(),
    includeHidden: z.boolean().optional(),
  }))
  .handler(async ({ input: { dirPath, includeHidden } }) => {
    console.log('[IPC] readDirectory called with path:', dirPath);
    try {
      await stat(dirPath);
    } catch {
      // Directory doesn't exist
      console.log('[IPC] Directory does not exist:', dirPath);
      return { path: dirPath, items: [] };
    }

    const entries = await readdir(dirPath, { withFileTypes: true });
    const items: ExplorerItem[] = [];

    console.log('[IPC] Found', entries.length, 'entries in directory');

    for (const entry of entries) {
      // Skip hidden files unless requested
      if (!includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = join(dirPath, entry.name);
      const item: ExplorerItem = {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
      };

      if (entry.isFile()) {
        try {
          const stats = await stat(fullPath);
          item.size = stats.size;
          const extIndex = entry.name.lastIndexOf('.');
          item.extension = extIndex > 0 ? entry.name.slice(extIndex + 1) : '';
        } catch {
          // File might not be accessible
        }
      }

      items.push(item);
    }

    // Sort: directories first, then files, both alphabetically
    items.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });

    console.log('[IPC] Returning', items.length, 'items');
    return { path: dirPath, items };
  });

/**
 * Read a file's content
 */
export const readFileContent = os
  .input(z.object({ filePath: z.string() }))
  .handler(async ({ input: { filePath } }) => {
    try {
      const content = await readFile(filePath, 'utf-8');
      return { path: filePath, content, exists: true };
    } catch (error) {
      return {
        path: filePath,
        content: '',
        exists: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

/**
 * Write a file's content
 */
export const writeFileContent = os
  .input(z.object({ filePath: z.string(), content: z.string() }))
  .handler(async ({ input: { filePath, content } }) => {
    try {
      await writeFile(filePath, content, 'utf-8');
      return { path: filePath, success: true };
    } catch (error) {
      return {
        path: filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

/**
 * Create a new file
 */
export const createFile = os
  .input(z.object({ filePath: z.string(), content: z.string().optional() }))
  .handler(async ({ input: { filePath, content = '' } }) => {
    try {
      const dirPath = join(filePath, '..');
      await mkdir(dirPath, { recursive: true });
      await writeFile(filePath, content, 'utf-8');
      return { path: filePath, success: true };
    } catch (error) {
      return {
        path: filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

/**
 * Create a new directory
 */
export const createDirectory = os
  .input(z.object({ dirPath: z.string() }))
  .handler(async ({ input: { dirPath } }) => {
    try {
      await mkdir(dirPath, { recursive: true });
      return { path: dirPath, success: true };
    } catch (error) {
      return {
        path: dirPath,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

/**
 * Delete a file or directory
 */
export const deleteItem = os
  .input(z.object({ itemPath: z.string() }))
  .handler(async ({ input: { itemPath } }) => {
    try {
      const { rm } = await import('fs/promises');
      await rm(itemPath, { recursive: true, force: true });
      return { path: itemPath, success: true };
    } catch (error) {
      return {
        path: itemPath,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

// =============================================================================
// MCP Configuration (.mcp.json)
// =============================================================================

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

/**
 * Read .mcp.json configuration
 */
export const readMcpConfig = os
  .input(z.object({ projectPath: z.string() }))
  .handler(async ({ input: { projectPath } }) => {
    const mcpJsonPath = join(projectPath, '.mcp.json');
    try {
      const content = await readFile(mcpJsonPath, 'utf-8');
      return JSON.parse(content) as McpConfig;
    } catch {
      return { mcpServers: {} }; // Default empty config
    }
  });

/**
 * Write .mcp.json configuration
 */
export const writeMcpConfig = os
  .input(z.object({
    projectPath: z.string(),
    config: z.object({
      mcpServers: z.record(z.string(), z.object({
        command: z.string(),
        args: z.array(z.string()),
        env: z.record(z.string(), z.string()).optional(),
      }))
    })
  }))
  .handler(async ({ input: { projectPath, config } }) => {
    const mcpJsonPath = join(projectPath, '.mcp.json');
    try {
      await writeFile(mcpJsonPath, JSON.stringify(config, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
