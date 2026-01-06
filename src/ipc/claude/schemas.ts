import { z } from "zod";

// Schema for readDirectory options
export const readDirectoryOptionsSchema = z.object({
  includeHidden: z.boolean().optional(),
});

// Schema for path strings
export const pathSchema = z.string();

// Schema for file write
export const fileWriteSchema = z.object({
  path: z.string(),
  content: z.string(),
});

// Schema for directory write
export const directoryWriteSchema = z.object({
  projectPath: z.string(),
  content: z.string(),
});

// Schema for settings write
export const settingsWriteSchema = z.object({
  projectPath: z.string(),
  content: z.string(),
});

// Schema for create directory
export const createClaudeDirectorySchema = z.object({
  projectPath: z.string(),
  type: z.enum(["skills", "commands", "agents", "rules", "hooks"]),
  name: z.string(),
});
