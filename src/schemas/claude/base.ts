/**
 * Base schemas and common types for Claude Code features.
 * These are shared across all Claude component types.
 */

import { z } from "zod";

/**
 * Common validation pattern for Claude item names (skills, agents, commands, hooks, rules)
 * - Lowercase letters, numbers, and hyphens only
 * - Must start and end with alphanumeric
 * - No consecutive hyphens
 * - Max 64 characters
 */
export const claudeNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(64, "Name must be 64 characters or less")
  .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed")
  .refine((val) => !val.startsWith("-"), "Name cannot start with a hyphen")
  .refine((val) => !val.endsWith("-"), "Name cannot end with a hyphen")
  .refine(
    (val) => !val.includes("--"),
    "Name cannot contain consecutive hyphens"
  );

/**
 * Color validation - supports common color formats
 */
export const colorSchema = z
  .string()
  .max(50, "Color must be 50 characters or less")
  .optional()
  .refine((val) => {
    if (!val) {
      return true;
    }
    // Allow named colors (blue, green, etc.)
    if (/^[a-z]+$/.test(val)) {
      return true;
    }
    // Allow hex colors (#fff, #ffffff)
    if (/^#[0-9a-f]{3,6}$/i.test(val)) {
      return true;
    }
    // Allow rgb/hsl formats
    if (
      /^rgba?\(\s*\d+%?\s*,\s*\d+%?\s*,\s*\d+%?\s*(,\s*[\d.]+\s*)?\)$/.test(val)
    ) {
      return true;
    }
    if (
      /^hsla?\(\s*\d+%?\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/.test(val)
    ) {
      return true;
    }
    return false;
  }, "Invalid color format. Use a named color (blue), hex (#fff), or CSS color function (rgb(), hsl())");

/**
 * Model names supported by Claude
 */
export const claudeModelSchema = z.enum([
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-5-opus-20241022",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
  "claude-3-opus-20240229",
  "sonnet",
  "haiku",
  "opus",
]);

/**
 * Array of strings (comma-separated in input, stored as array)
 */
export const stringArraySchema = z
  .string()
  .transform((val) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  )
  .optional();

/**
 * Generic frontmatter schema helper
 */
export function createFrontmatterSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape);
}

/**
 * Type exports
 */
export type ClaudeName = z.infer<typeof claudeNameSchema>;
export type ClaudeColor = z.infer<typeof colorSchema>;
export type ClaudeModel = z.infer<typeof claudeModelSchema>;
