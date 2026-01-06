/**
 * Command Schema - Validates Claude command configuration
 *
 * Command files (.cmd.md) have YAML frontmatter with command metadata
 * and a markdown body with the command implementation.
 *
 * Reference: https://docs.anthropic.com/en/docs/build-with-claude/commands
 */

import { z } from 'zod';
import { claudeNameSchema } from './base';

/**
 * Command frontmatter schema
 */
export const commandFrontmatterSchema = z.object({
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  category: z.string().optional(),
  enabled: z.boolean().optional(),
  arguments: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    type: z.enum(['string', 'number', 'boolean', 'array']).optional(),
  })).optional(),
});

/**
 * Full command content schema (frontmatter + body)
 */
export const commandContentSchema = z.object({
  frontmatter: commandFrontmatterSchema,
  body: z.string()
    .refine(val => val.includes('$ARGUMENTS'), {
      message: 'Command body must include $ARGUMENTS placeholder',
    }),
});

/**
 * Command form schema for the UI (simplified - focuses on name)
 */
export const commandFormSchema = z.object({
  name: claudeNameSchema,
});

/**
 * Create command schema (minimal fields)
 */
export const commandCreateSchema = z.object({
  name: claudeNameSchema,
});

/**
 * Helper to build command file content
 */
export function buildCommandContent(name: string, description?: string): string {
  const desc = description || 'My custom command';

  return `---
description: ${desc}
---

# ${name}

$ARGUMENTS

## Instructions

Add your command instructions here.

## Steps

1. First step
2. Second step
3. Third step
`;
}

/**
 * Helper to parse command file content
 */
export function parseCommandContent(content: string): {
  frontmatter?: z.infer<typeof commandFrontmatterSchema>;
  body: string;
  hasFrontmatter: boolean;
  rawFrontmatter?: string;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    const rawFrontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];

    // Simple YAML parser
    const frontmatter: Record<string, any> = {};

    const descMatch = rawFrontmatter.match(/^description:\s*(.+)$/m);
    if (descMatch) {
      frontmatter.description = descMatch[1].trim().replace(/^["']|["']$/g, '');
    }

    const categoryMatch = rawFrontmatter.match(/^category:\s*(.+)$/m);
    if (categoryMatch) {
      frontmatter.category = categoryMatch[1].trim();
    }

    const enabledMatch = rawFrontmatter.match(/^enabled:\s*(true|false)$/m);
    if (enabledMatch) {
      frontmatter.enabled = enabledMatch[1] === 'true';
    }

    return {
      frontmatter: frontmatter as any,
      body,
      hasFrontmatter: true,
      rawFrontmatter,
    };
  }

  return { body: content, hasFrontmatter: false };
}

/**
 * Helper to validate command structure
 */
export function validateCommandStructure(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content.trim()) {
    return { valid: false, error: 'Command content cannot be empty' };
  }

  const hasFrontmatter = content.match(/^---\n[\s\S]*?\n---/);
  if (!hasFrontmatter) {
    return { valid: false, error: 'Command must have YAML frontmatter (---) with description' };
  }

  if (!content.includes('$ARGUMENTS')) {
    return { valid: false, error: 'Command should include $ARGUMENTS placeholder for user arguments' };
  }

  return { valid: true };
}

/**
 * Type exports
 */
export type CommandFrontmatter = z.infer<typeof commandFrontmatterSchema>;
export type CommandFormValues = z.infer<typeof commandFormSchema>;
export type CommandCreateValues = z.infer<typeof commandCreateSchema>;
