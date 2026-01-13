/**
 * Hook Schema - Validates Claude hook configuration
 *
 * Hook files (.hook.json) are JSON files defining lifecycle hooks.
 *
 * Reference: https://docs.anthropic.com/en/docs/build-with-claude/hooks
 */

import { z } from "zod";
import { claudeNameSchema } from "./base";

/**
 * Hook types - lifecycle events where hooks can run
 */
export const hookTypeSchema = z.enum([
  "SessionStart",
  "PromptSubmit",
  "ToolUse",
  "ToolOutput",
  "Response",
  "SessionEnd",
]);

/**
 * Hook JSON schema (the actual file content)
 */
export const hookJsonSchema = z.object({
  name: claudeNameSchema,
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  hookType: hookTypeSchema,
  enabled: z.boolean().default(true),
  // Script content
  script: z.string().optional(),
  // Lifecycle methods (alternative to script)
  onStart: z.string().optional(),
  onSubmit: z.string().optional(),
  onToolUse: z.string().optional(),
  onToolOutput: z.string().optional(),
  onResponse: z.string().optional(),
  onEnd: z.string().optional(),
});

/**
 * Validation - ensures at least one executable method exists
 */
export const hookJsonSchemaValidated = hookJsonSchema.refine(
  (data) => {
    return !!(
      data.script ||
      data.onStart ||
      data.onSubmit ||
      data.onToolUse ||
      data.onToolOutput ||
      data.onResponse ||
      data.onEnd
    );
  },
  {
    message:
      "Hook must have a script or at least one lifecycle method (onStart, onSubmit, onToolUse, onToolOutput, onResponse, onEnd)",
  }
);

/**
 * Hook form schema for the UI
 */
export const hookFormSchema = z.object({
  name: claudeNameSchema,
  hookType: hookTypeSchema,
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  enabled: z.boolean().default(true),
  script: z.string().optional(),
});

/**
 * Create hook schema (minimal fields)
 */
export const hookCreateSchema = z.object({
  name: claudeNameSchema,
  hookType: hookTypeSchema,
});

/**
 * Helper to build default hook JSON
 */
export function buildHookJson(
  values: z.infer<typeof hookCreateSchema> & { description?: string }
): string {
  const { name, hookType, description } = values;

  const hookData = {
    name,
    description: description || `My ${hookType} hook`,
    hookType,
    enabled: true,
    script: `// ${hookType} hook script
// This script runs when ${hookType} event occurs

console.log('${hookType} hook executed:', {
  context: typeof context !== 'undefined' ? context : 'N/A',
});`,
  };

  return JSON.stringify(hookData, null, 2);
}

/**
 * Helper to parse hook JSON file
 */
export function parseHookJson(content: string): {
  success: boolean;
  data?: z.infer<typeof hookJsonSchema>;
  error?: string;
} {
  try {
    const parsed = JSON.parse(content);
    const result = hookJsonSchemaValidated.safeParse(parsed);

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
 * Helper to validate hook script syntax (without executing)
 * Note: In the renderer process, we only validate that the script is a string
 * Actual JavaScript syntax validation would require eval/new Function which
 * violates CSP. The CLI will validate the actual script syntax.
 */
export function validateHookScript(script: string): {
  valid: boolean;
  error?: string;
} {
  // Basic validation - just check it's a non-empty string
  // CSP prevents using new Function() for syntax checking in renderer
  if (typeof script !== "string") {
    return { valid: false, error: "Script must be a string" };
  }
  if (script.trim().length === 0) {
    return { valid: false, error: "Script cannot be empty" };
  }
  return { valid: true };
}

/**
 * Type exports
 */
export type HookType = z.infer<typeof hookTypeSchema>;
export type HookJson = z.infer<typeof hookJsonSchema>;
export type HookFormValues = z.infer<typeof hookFormSchema>;
export type HookCreateValues = z.infer<typeof hookCreateSchema>;
