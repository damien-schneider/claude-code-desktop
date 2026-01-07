/**
 * Agent Schema - Validates Claude agent configuration
 *
 * Agent files (.agent.md) have YAML frontmatter with agent metadata
 * and a markdown body with instructions.
 *
 * Reference: https://docs.anthropic.com/en/docs/build-with-claude/agents
 */

import { z } from "zod";
import {
  claudeModelSchema,
  claudeNameSchema,
  colorSchema,
  stringArraySchema,
} from "./base";

/**
 * Agent frontmatter schema
 */
export const agentFrontmatterSchema = z.object({
  name: claudeNameSchema,
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or less"),
  instructions: z
    .string()
    .max(500, "Instructions must be 500 characters or less")
    .optional(),
  tools: stringArraySchema,
  permissions: stringArraySchema,
  model: claudeModelSchema,
  color: colorSchema,
});

/**
 * Full agent content schema (frontmatter + body)
 */
export const agentContentSchema = z.object({
  frontmatter: agentFrontmatterSchema,
  body: z.string().optional(),
});

/**
 * Agent form schema for the UI
 */
export const agentFormSchema = z.object({
  name: claudeNameSchema,
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or less"),
  instructions: z
    .string()
    .max(500, "Instructions must be 500 characters or less")
    .optional(),
  tools: z.string().optional(),
  permissions: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  content: z.string().optional(),
});

/**
 * Create agent schema (minimal fields)
 */
export const agentCreateSchema = z.object({
  name: claudeNameSchema.optional(),
});

/**
 * Helper to build agent file content from form values
 */
export function buildAgentContent(
  values: z.infer<typeof agentFormSchema>
): string {
  const { name, description, content = "" } = values;

  const frontmatterData = buildFrontmatterData(values);
  const frontmatter = formatFrontmatter(frontmatterData);

  return `${frontmatter}\n# ${name}\n\nYou are a specialist agent for...\n\n## Instructions\n\n${content}`;
}

/**
 * Build frontmatter data object from form values
 */
function buildFrontmatterData(
  values: z.infer<typeof agentFormSchema>
): Record<string, string | string[]> {
  const data: Record<string, string | string[]> = {
    name: values.name,
    description: values.description,
  };

  if (values.instructions) {
    data.instructions = values.instructions;
  }
  if (values.tools) {
    data.tools = parseCommaSeparatedList(values.tools);
  }
  if (values.permissions) {
    data.permissions = parseCommaSeparatedList(values.permissions);
  }
  if (values.model) {
    data.model = values.model;
  }
  if (values.color) {
    data.color = values.color;
  }

  return data;
}

/**
 * Parse comma-separated list into array
 */
function parseCommaSeparatedList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Format frontmatter data as YAML string
 */
function formatFrontmatter(data: Record<string, string | string[]>): string {
  let frontmatter = "---\n";

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        frontmatter += `${key}:\n`;
        for (const item of value) {
          frontmatter += `  - ${item}\n`;
        }
      }
    } else {
      frontmatter += `${key}: ${value}\n`;
    }
  }

  frontmatter += "---\n";
  return frontmatter;
}

/**
 * Helper to parse agent file content
 */
export function parseAgentContent(content: string): {
  frontmatter?: z.infer<typeof agentFrontmatterSchema>;
  body?: string;
  rawFrontmatter?: string;
} {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!yamlMatch) {
    return { body: content };
  }

  const rawFrontmatter = yamlMatch[1];
  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, "");

  // Simple YAML parser for the frontmatter
  // biome-ignore lint/suspicious/noExplicitAny: Required for JSON schema validation
  const frontmatter: Record<string, any> = {};
  const lines = rawFrontmatter.split("\n");

  for (const line of lines) {
    const match = line.match(/^([a-z]+):\s*(.+)$/i);
    if (match) {
      const [, key, value] = match;
      const trimmedValue = value.trim().replace(/^["']|["']$/g, "");

      // Handle arrays
      if (trimmedValue.startsWith("- ")) {
        frontmatter[key] = trimmedValue
          .split("\n")
          .map((l) => l.replace(/^-\s*/, "").trim())
          .filter(Boolean);
      } else {
        frontmatter[key] = trimmedValue;
      }
    }
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
export type AgentFrontmatter = z.infer<typeof agentFrontmatterSchema>;
export type AgentFormValues = z.infer<typeof agentFormSchema>;
export type AgentCreateValues = z.infer<typeof agentCreateSchema>;
