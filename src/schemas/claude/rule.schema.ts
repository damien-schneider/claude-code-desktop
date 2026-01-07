/**
 * Rule Schema - Validates Claude rule configuration
 *
 * Rule files (.rule.md) are simple markdown files.
 * They can have optional YAML frontmatter but typically just contain markdown content.
 *
 * Reference: https://docs.anthropic.com/en/docs/build-with-claude/rules
 */

import { z } from "zod";
import { claudeNameSchema } from "./base";

/**
 * Rule frontmatter schema (optional)
 */
export const ruleFrontmatterSchema = z.object({
  name: claudeNameSchema.optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  category: z.string().optional(),
});

/**
 * Full rule content schema
 */
export const ruleContentSchema = z.object({
  frontmatter: ruleFrontmatterSchema.optional(),
  body: z.string().min(1, "Rule content cannot be empty"),
});

/**
 * Rule form schema for the UI
 */
export const ruleFormSchema = z.object({
  content: z.string().min(1, "Rule content cannot be empty"),
});

/**
 * Create rule schema (minimal fields)
 */
export const ruleCreateSchema = z.object({
  name: claudeNameSchema.optional(),
});

/**
 * Helper to parse rule file content
 */
export function parseRuleContent(content: string): {
  frontmatter?: z.infer<typeof ruleFrontmatterSchema>;
  body: string;
  hasFrontmatter: boolean;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    // Simple YAML parser
    const frontmatter: Record<string, any> = {};
    const yaml = frontmatterMatch[1];

    const nameMatch = yaml.match(/^name:\s*(.+)$/m);
    const descMatch = yaml.match(/^description:\s*(.+)$/m);
    const priorityMatch = yaml.match(/^priority:\s*(.+)$/m);
    const categoryMatch = yaml.match(/^category:\s*(.+)$/m);

    if (nameMatch) {
      frontmatter.name = nameMatch[1].trim();
    }
    if (descMatch) {
      frontmatter.description = descMatch[1].trim().replace(/^["']|["']$/g, "");
    }
    if (priorityMatch) {
      frontmatter.priority = priorityMatch[1].trim();
    }
    if (categoryMatch) {
      frontmatter.category = categoryMatch[1].trim();
    }

    return {
      frontmatter: frontmatter as any,
      body: frontmatterMatch[2],
      hasFrontmatter: true,
    };
  }

  return { body: content, hasFrontmatter: false };
}

/**
 * Helper to build rule file content
 */
export function buildRuleContent(
  frontmatter: z.infer<typeof ruleFrontmatterSchema> | undefined,
  body: string
): string {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return body;
  }

  let yaml = "---\n";
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined) {
      yaml += `${key}: ${value}\n`;
    }
  }
  yaml += "---\n";

  return `${yaml}\n${body}`;
}

/**
 * Type exports
 */
export type RuleFrontmatter = z.infer<typeof ruleFrontmatterSchema>;
export type RuleFormValues = z.infer<typeof ruleFormSchema>;
export type RuleCreateValues = z.infer<typeof ruleCreateSchema>;
