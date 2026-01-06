/**
 * Directory Reader Abstraction Layer
 *
 * Provides a consistent way to read different types of Claude directories
 * (commands, skills, agents, rules, hooks) with proper handling of subdirectories.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

export interface ClaudeFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  category?: string; // For grouping (e.g., 'git', 'testing')
}

export interface ClaudeDirectoryResult {
  path: string;
  type: 'skills' | 'commands' | 'agents' | 'rules' | 'hooks';
  files: ClaudeFile[];
}

/**
 * Configuration for how to read different directory types
 */
interface DirectoryConfig {
  // Whether to recurse into subdirectories
  recursive: boolean;

  // For recursive types: which file extensions to include
  fileExtensions?: string[];

  // Whether directories represent items (like skills/agents with SKILL.md)
  directoryAsItem: boolean;

  // Default file name when directory is an item
  defaultFileName?: string;
}

/**
 * Directory configurations for each Claude type
 */
const DIRECTORY_CONFIGS: Record<'skills' | 'commands' | 'agents' | 'rules' | 'hooks', DirectoryConfig> = {
  // Commands: recurse into subfolders, each .md file is a command
  commands: {
    recursive: true,
    fileExtensions: ['.md'],
    directoryAsItem: false,
  },

  // Skills: each subdirectory is a skill with SKILL.md inside
  skills: {
    recursive: false,
    directoryAsItem: true,
    defaultFileName: 'SKILL.md',
  },

  // Agents: flat directory of .md files
  agents: {
    recursive: false,
    fileExtensions: ['.md'],
    directoryAsItem: false,
  },

  // Rules: flat directory of .md files
  rules: {
    recursive: false,
    fileExtensions: ['.md'],
    directoryAsItem: false,
  },

  // Hooks: flat directory of .json files
  hooks: {
    recursive: false,
    fileExtensions: ['.json'],
    directoryAsItem: false,
  },
};

/**
 * Check if a file has a valid extension for the directory type
 */
function hasValidExtension(fileName: string, extensions: string[] | undefined): boolean {
  if (!extensions) return true;
  return extensions.some((ext) => fileName.endsWith(ext));
}

/**
 * Read a directory recursively for commands
 * Commands are organized as: commands/category/name.md
 */
async function readCommandsDirectory(claudePath: string): Promise<ClaudeFile[]> {
  console.log('[directory-reader] readCommandsDirectory called with:', claudePath);
  const files: ClaudeFile[] = [];
  const entries = await readdir(claudePath, { withFileTypes: true });
  console.log('[directory-reader] Found entries:', entries.length);

  for (const entry of entries) {
    const fullPath = join(claudePath, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectory (e.g., 'git', 'testing')
      try {
        const subEntries = await readdir(fullPath, { withFileTypes: true });
        for (const subEntry of subEntries) {
          if (subEntry.isFile() && subEntry.name.endsWith('.md')) {
            const subFilePath = join(fullPath, subEntry.name);
            try {
              const content = await readFile(subFilePath, 'utf-8');
              // Command name: "category/command-name"
              const commandName = `${entry.name}/${subEntry.name.replace('.md', '')}`;
              files.push({
                name: commandName,
                path: subFilePath,
                type: 'file',
                content,
                category: entry.name,
              });
            } catch {
              // Skip files that can't be read
            }
          }
        }
      } catch {
        // Skip subdirectories that can't be read
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Root-level command files (without subfolder)
      try {
        const content = await readFile(fullPath, 'utf-8');
        files.push({
          name: entry.name.replace('.md', ''),
          path: fullPath,
          type: 'file',
          content,
          category: undefined, // No category for root-level commands
        });
      } catch {
        // Skip files that can't be read
      }
    }
  }

  console.log('[directory-reader] Returning', files.length, 'command files');
  for (const f of files) {
    console.log('[directory-reader]   -', f.name, '(category:', f.category || 'none', ')');
  }
  return files;
}

/**
 * Read a directory where subdirectories are items (skills/agents)
 */
async function readItemBasedDirectory(
  claudePath: string,
  defaultFileName: string,
): Promise<ClaudeFile[]> {
  const files: ClaudeFile[] = [];
  const entries = await readdir(claudePath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(claudePath, entry.name);

    if (entry.isDirectory()) {
      // Look for the main file in the subdirectory
      const mainFilePath = join(fullPath, defaultFileName);
      try {
        const content = await readFile(mainFilePath, 'utf-8');
        files.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          content,
        });
      } catch {
        // Directory doesn't have the main file, skip it
        files.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
        });
      }
    } else if (hasValidExtension(entry.name, ['.md', '.json'])) {
      // Direct files in the root (less common for skills/agents)
      try {
        const content = await readFile(fullPath, 'utf-8');
        files.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          content,
        });
      } catch {
        // Skip files that can't be read
      }
    }
  }

  return files;
}

/**
 * Read a flat directory (rules, hooks)
 */
async function readFlatDirectory(
  claudePath: string,
  extensions: string[] = ['.md', '.json'],
): Promise<ClaudeFile[]> {
  const files: ClaudeFile[] = [];
  const entries = await readdir(claudePath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && hasValidExtension(entry.name, extensions)) {
      const fullPath = join(claudePath, entry.name);
      try {
        const content = await readFile(fullPath, 'utf-8');
        files.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          content,
        });
      } catch {
        // Skip files that can't be read
      }
    }
  }

  return files;
}

/**
 * Main function to read a Claude directory
 * Uses the appropriate strategy based on the directory type
 */
export async function readClaudeDirectory(
  projectPath: string,
  type: 'skills' | 'commands' | 'agents' | 'rules' | 'hooks',
): Promise<ClaudeDirectoryResult> {
  const claudePath = join(projectPath, '.claude', type);

  // Check if directory exists
  try {
    await stat(claudePath);
  } catch {
    // Directory doesn't exist
    return { path: claudePath, type, files: [] };
  }

  const config = DIRECTORY_CONFIGS[type];
  let files: ClaudeFile[] = [];

  // Use the appropriate reading strategy
  if (type === 'commands') {
    files = await readCommandsDirectory(claudePath);
  } else if (config.directoryAsItem) {
    // Skills and Agents
    files = await readItemBasedDirectory(claudePath, config.defaultFileName!);
  } else {
    // Rules and Hooks (flat directories)
    files = await readFlatDirectory(claudePath, config.fileExtensions);
  }

  return { path: claudePath, type, files };
}

/**
 * Get the display name for a file (removes extension, etc.)
 */
export function getDisplayName(file: ClaudeFile, type: string): string {
  if (file.type === 'directory') {
    return file.name;
  }

  // For files, remove the extension
  const name = file.name;
  const lastDot = name.lastIndexOf('.');

  if (type === 'commands' && file.category) {
    // For commands in subfolders, name already includes category
    // Just need to remove .md if present
    return name.endsWith('.md') ? name.replace('.md', '') : name;
  }

  if (lastDot > 0) {
    return name.substring(0, lastDot);
  }

  return name;
}

/**
 * Get the category/group for a file
 */
export function getFileCategory(file: ClaudeFile): string | undefined {
  return file.category;
}
