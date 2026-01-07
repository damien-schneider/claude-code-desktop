/**
 * Settings Schema - Validates Claude settings.json configuration
 *
 * settings.json is the main configuration file for Claude Code projects.
 * It controls tool permissions, model preferences, and other settings.
 *
 * Reference: https://docs.anthropic.com/en/docs/build-with-claude/settings
 */

import { z } from "zod";

// Top-level regex patterns for performance
const TOOL_PERMISSION_REGEX = /^[a-zA-Z0-9_*():\-/]+$/;

/**
 * Individual tool permission pattern
 * Matches patterns like "Edit", "Bash(git:*)", "Read(*)", etc.
 */
export const toolPermissionSchema = z
  .string()
  .min(1, "Tool permission cannot be empty")
  .refine((val) => {
    // Must be alphanumeric with colons, parentheses, asterisks, dashes, underscores
    return TOOL_PERMISSION_REGEX.test(val);
  }, "Invalid tool permission format");

/**
 * Model identifier (supports shorthands and full model names)
 */
export const modelIdentifierSchema = z
  .string()
  .min(1, "Model identifier cannot be empty")
  .max(200, "Model identifier too long");

/**
 * Environment variable key
 */
export const envVarKeySchema = z
  .string()
  .min(1, "Environment variable key cannot be empty")
  .regex(
    /^[A-Z_][A-Z0-9_]*$/,
    "Environment variable keys must be uppercase with underscores"
  );

/**
 * Environment variable value
 */
export const envVarValueSchema = z.string();

/**
 * Theme preference
 */
export const themeSchema = z.enum(["light", "dark", "system"]);

/**
 * MCP server type
 */
export const mcpServerTypeSchema = z.enum(["stdio", "sse"]);

/**
 * MCP server environment variables
 */
export const mcpServerEnvSchema = z
  .record(envVarKeySchema, envVarValueSchema)
  .optional();

/**
 * MCP server configuration
 */
export const mcpServerSchema = z.object({
  type: mcpServerTypeSchema.optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: mcpServerEnvSchema,
  url: z.string().url().optional(), // For SSE type
});

/**
 * MCP servers collection
 */
export const mcpServersSchema = z.record(z.string().min(1), mcpServerSchema);

/**
 * Main settings.json schema
 *
 * This is the primary schema for validating .claude/settings.json files.
 */
export const settingsJsonSchema = z.object({
  // Tool permissions allowlist
  allowedTools: z.array(toolPermissionSchema).optional(),

  // Model preferences per provider
  modelPreferences: z
    .record(modelIdentifierSchema, modelIdentifierSchema)
    .optional(),

  // Theme preference
  theme: themeSchema.optional(),

  // Environment variables for Claude Code
  environmentVariables: z.record(envVarKeySchema, envVarValueSchema).optional(),

  // Human-specified instructions
  humanInstructions: z.string().max(5000).optional(),

  // Custom prompt template
  customPrompt: z.string().max(10_000).optional(),
});

/**
 * Form schema for the Settings UI
 * Simplified for form inputs
 */
export const settingsFormSchema = z.object({
  allowedTools: z.string().optional(),
  modelPreferences: z.string().optional(),
  theme: themeSchema.optional(),
});

/**
 * Helper to parse settings JSON file
 */
export function parseSettingsJson(content: string): {
  success: boolean;
  data?: z.infer<typeof settingsJsonSchema>;
  error?: string;
} {
  try {
    const parsed = JSON.parse(content);
    const result = settingsJsonSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      error: result.error.issues.map((e) => e.message).join(", "),
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Invalid JSON",
    };
  }
}

/**
 * Helper to build default settings JSON
 */
export function buildDefaultSettings(): string {
  const defaultSettings = {
    allowedTools: [],
    modelPreferences: {},
    theme: "system" as const,
  };

  return JSON.stringify(defaultSettings, null, 2);
}

/**
 * Helper to format allowed tools array to string for editing
 */
export function formatAllowedTools(tools: string[]): string {
  if (tools.length === 0) {
    return "";
  }
  return tools.join("\n");
}

/**
 * Helper to parse allowed tools string back to array
 */
export function parseAllowedTools(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Helper to format model preferences to string for editing
 */
export function formatModelPreferences(prefs: Record<string, string>): string {
  const entries = Object.entries(prefs);
  if (entries.length === 0) {
    return "";
  }
  return entries.map(([key, value]) => `${key}=${value}`).join("\n");
}

/**
 * Helper to parse model preferences string back to object
 */
export function parseModelPreferences(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = input.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed?.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim();

    if (key && value) {
      result[key.trim()] = value;
    }
  }

  return result;
}

/**
 * Type exports
 */
export type SettingsJson = z.infer<typeof settingsJsonSchema>;
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
export type McpServerConfig = z.infer<typeof mcpServerSchema>;
export type Theme = z.infer<typeof themeSchema>;
