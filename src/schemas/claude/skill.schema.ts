/**
 * Skill Schema - Validates Claude skill configuration
 *
 * Skill files (SKILL.md) have YAML frontmatter with skill metadata
 * and a markdown body with detailed instructions.
 *
 * Reference: https://docs.anthropic.com/en/docs/build-with-claude/skills
 */

import { z } from "zod";
import { claudeNameSchema } from "./base";

// Top-level regex patterns for performance
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
const FRONTMATTER_REPLACE_REGEX = /^---\n[\s\S]*?\n---\n?/;
const SKILL_NAME_REGEX = /^name:\s*(.+)$/m;
const SKILL_DESCRIPTION_REGEX = /^description:\s*(.+)$/m;
const SKILL_LICENSE_REGEX = /^license:\s*(.+)$/m;
const SKILL_COMPATIBILITY_REGEX = /^compatibility:\s*(.+)$/m;

/**
 * Skill frontmatter schema
 */
export const skillFrontmatterSchema = z.object({
  name: claudeNameSchema,
  description: z
    .string()
    .min(1, "Description is required")
    .max(1024, "Description must be 1024 characters or less"),
  license: z
    .string()
    .max(200, "License must be 200 characters or less")
    .optional(),
  compatibility: z
    .string()
    .max(500, "Compatibility must be 500 characters or less")
    .optional(),
});

/**
 * Full skill content schema (frontmatter + body)
 */
export const skillContentSchema = z.object({
  frontmatter: skillFrontmatterSchema,
  body: z.string().optional(),
});

/**
 * Skill form schema for the UI
 */
export const skillFormSchema = z.object({
  name: claudeNameSchema,
  description: z
    .string()
    .min(1, "Description is required")
    .max(1024, "Description must be 1024 characters or less"),
  license: z
    .string()
    .max(200, "License must be 200 characters or less")
    .optional(),
  compatibility: z
    .string()
    .max(500, "Compatibility must be 500 characters or less")
    .optional(),
  content: z.string().optional(),
});

/**
 * Create skill schema (minimal fields)
 */
export const skillCreateSchema = z.object({
  name: claudeNameSchema.optional(),
});

/**
 * Helper to build skill file content from form values
 */
export function buildSkillContent(
  values: z.infer<typeof skillFormSchema>
): string {
  const { name, description, license, compatibility, content = "" } = values;

  // Normalize the name
  const normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  let frontmatter = `---
name: ${normalizedName}
description: ${description}
`;

  if (license) {
    frontmatter += `license: ${license}\n`;
  }

  if (compatibility) {
    frontmatter += `compatibility: ${compatibility}\n`;
  }

  frontmatter += "---\n";

  return `${frontmatter}\n${content}`;
}

/**
 * Helper to parse skill file content
 */
export function parseSkillContent(content: string): {
  frontmatter?: z.infer<typeof skillFrontmatterSchema>;
  body?: string;
  rawFrontmatter?: string;
} {
  const yamlMatch = content.match(FRONTMATTER_REGEX);
  if (!yamlMatch) {
    return { body: content };
  }

  const rawFrontmatter = yamlMatch[1];
  const body = content.replace(FRONTMATTER_REPLACE_REGEX, "");

  // Simple YAML parser
  // biome-ignore lint/suspicious/noExplicitAny: Required for JSON schema validation
  const frontmatter: Record<string, any> = {};

  const nameMatch = rawFrontmatter.match(SKILL_NAME_REGEX);
  const descMatch = rawFrontmatter.match(SKILL_DESCRIPTION_REGEX);
  const licenseMatch = rawFrontmatter.match(SKILL_LICENSE_REGEX);
  const compatMatch = rawFrontmatter.match(SKILL_COMPATIBILITY_REGEX);

  if (nameMatch) {
    frontmatter.name = nameMatch[1].trim();
  }
  if (descMatch) {
    frontmatter.description = descMatch[1].trim().replace(/^["']|["']$/g, "");
  }
  if (licenseMatch) {
    frontmatter.license = licenseMatch[1].trim();
  }
  if (compatMatch) {
    frontmatter.compatibility = compatMatch[1].trim();
  }

  return {
    // biome-ignore lint/suspicious/noExplicitAny: Required for JSON schema validation
    frontmatter: frontmatter as any,
    body,
    rawFrontmatter,
  };
}

/**
 * Type exports
 */
export type SkillFrontmatter = z.infer<typeof skillFrontmatterSchema>;
export type SkillFormValues = z.infer<typeof skillFormSchema>;
export type SkillCreateValues = z.infer<typeof skillCreateSchema>;
