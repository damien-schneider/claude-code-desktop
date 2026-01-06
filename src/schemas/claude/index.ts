/**
 * Centralized Claude Code Schemas
 *
 * This is the main folder to maintain for all Claude Code feature validation.
 * When Claude Code updates its file formats, update the corresponding schema here.
 *
 * Schema files:
 * - base.ts: Common validation patterns (names, colors, models)
 * - agent.schema.ts: .agent.md file validation
 * - skill.schema.ts: SKILL.md file validation
 * - rule.schema.ts: .rule.md file validation
 * - hook.schema.ts: .hook.json file validation
 * - command.schema.ts: .cmd.md file validation
 * - settings.schema.ts: settings.json validation
 * - claude-md.schema.ts: CLAUDE.md file validation
 */

// Base schemas (common types)
export * from './base';

// Agent schemas
export * from './agent.schema';

// Skill schemas
export * from './skill.schema';

// Rule schemas
export * from './rule.schema';

// Hook schemas
export * from './hook.schema';

// Command schemas
export * from './command.schema';

// Settings schemas
export * from './settings.schema';

// CLAUDE.md schemas
export * from './claude-md.schema';

/**
 * Type unions for all Claude item types
 */
export type ClaudeItemType = 'agent' | 'skill' | 'rule' | 'hook' | 'command';

/**
 * File extensions for each Claude item type
 */
export const CLAUDE_FILE_EXTENSIONS: Record<ClaudeItemType, string> = {
  agent: '.agent.md',
  skill: 'SKILL.md',
  rule: '.rule.md',
  hook: '.hook.json',
  command: '.cmd.md',
} as const;

/**
 * Directory names for each Claude item type
 */
export const CLAUDE_DIRECTORY_NAMES: Record<ClaudeItemType, string> = {
  agent: 'agents',
  skill: 'skills',
  rule: 'rules',
  hook: 'hooks',
  command: 'commands',
} as const;

/**
 * All Claude feature types
 */
export const CLAUDE_FEATURE_TYPES = [
  'skills',
  'commands',
  'agents',
  'rules',
  'hooks',
] as const;

export type ClaudeFeatureType = typeof CLAUDE_FEATURE_TYPES[number];
