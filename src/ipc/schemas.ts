import { z } from "zod";

/**
 * Zod schemas for validating Claude Code configuration files
 *
 * These schemas ensure that all files edited through the app follow
 * the correct format for:
 * - Skills (agentskills.io specification)
 * - CLAUDE.md
 * - Rules
 * - Agents
 * - Commands
 * - Pre-hooks
 * - MCP configuration
 */

// ============================================================================
// SKILL SCHEMAS (Agent Skills Specification - agentskills.io)
// ============================================================================

/**
 * Skill name validation - must be 1-64 chars, lowercase/numbers/hyphens only
 */
export const skillNameSchema = z
  .string()
  .min(1, "Skill name is required")
  .max(64, "Skill name must be 64 characters or less")
  .regex(
    /^[a-z0-9-]+$/,
    "Skill name must contain only lowercase letters, numbers, and hyphens"
  )
  .refine(
    (name) => !name.startsWith("-"),
    "Skill name cannot start with a hyphen"
  )
  .refine((name) => !name.endsWith("-"), "Skill name cannot end with a hyphen")
  .refine(
    (name) => !name.includes("--"),
    "Skill name cannot contain consecutive hyphens"
  );

/**
 * Skill frontmatter schema
 * Based on: https://github.com/agentskills/agentskills
 */
export const skillFrontmatterSchema = z.object({
  name: skillNameSchema,
  description: z
    .string()
    .min(1, "Skill description is required")
    .max(1024, "Skill description must be 1024 characters or less"),
  license: z.string().optional(),
  compatibility: z
    .string()
    .max(500, "Compatibility string must be 500 characters or less")
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type SkillFrontmatter = z.infer<typeof skillFrontmatterSchema>;

// ============================================================================
// CLAUDE.md SCHEMA
// ============================================================================

/**
 * CLAUDE.md file schema
 * Project-specific instructions for Claude Code
 */
export const claudeMDSchema = z.object({
  content: z.string().min(1, "CLAUDE.md content is required"),
});

export type ClaudeMD = z.infer<typeof claudeMDSchema>;

// ============================================================================
// RULE SCHEMA
// ============================================================================

/**
 * Rule file schema (.claude/rules/*.md)
 * Individual rules that guide Claude's behavior
 */
export const ruleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  content: z.string().min(1, "Rule content is required"),
  description: z.string().optional(),
});

export type Rule = z.infer<typeof ruleSchema>;

// ============================================================================
// AGENT SCHEMA
// ============================================================================

/**
 * Agent frontmatter schema (.claude/agents/*.md)
 * Sub-agents that can be invoked by Claude
 */
export const agentFrontmatterSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  description: z.string().min(1, "Agent description is required"),
  instructions: z.string().optional(),
  tools: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  model: z.string().optional(),
  color: z.string().optional(),
});

export type AgentFrontmatter = z.infer<typeof agentFrontmatterSchema>;

// ============================================================================
// COMMAND SCHEMA
// ============================================================================

/**
 * Command schema (.claude/commands/*.md)
 * Custom slash commands for Claude Code
 */
export const commandSchema = z.object({
  name: z.string().min(1, "Command name is required"),
  description: z.string().min(1, "Command description is required"),
  arguments: z.string().optional(),
  content: z.string().min(1, "Command content is required"),
});

export type Command = z.infer<typeof commandSchema>;

// ============================================================================
// HOOK SCHEMA
// ============================================================================

/**
 * Hook type schema
 * Based on: https://code.claude.com/docs/en/hooks
 */
export const hookTypeSchema = z.enum([
  "PrePrompt",
  "PostPrompt",
  "PreToolUse",
  "PostToolUse",
  "PreResponse",
  "PostResponse",
]);

/**
 * Hook schema (.claude/hooks/hooks.json)
 */
export const hookSchema = z.object({
  name: z.string().min(1, "Hook name is required"),
  type: hookTypeSchema,
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(50),
  handler: z.string().min(1, "Hook handler is required"),
});

export const hooksConfigSchema = z.object({
  hooks: z.array(hookSchema),
});

export type Hook = z.infer<typeof hookSchema>;
export type HooksConfig = z.infer<typeof hooksConfigSchema>;

// ============================================================================
// MCP SCHEMA
// ============================================================================

/**
 * MCP transport type schema
 * Based on: https://modelcontextprotocol.io/
 */
export const mcpTransportTypeSchema = z.enum(["stdio", "sse", "websocket"]);

/**
 * MCP server schema
 */
export const mcpServerSchema = z.object({
  name: z.string().min(1, "MCP server name is required"),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  transport: mcpTransportTypeSchema.optional(),
  url: z.string().url().optional(),
  enabled: z.boolean().default(true),
});

export const mcpConfigSchema = z.object({
  mcpServers: z.record(z.string(), mcpServerSchema),
});

export type MCPServer = z.infer<typeof mcpServerSchema>;
export type MCPConfig = z.infer<typeof mcpConfigSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse and validate YAML frontmatter from a markdown file
 */
export const parseFrontmatter = <T extends z.ZodType>(
  content: string,
  schema: T
): { frontmatter?: z.infer<T>; body: string } => {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!yamlMatch) {
    return { body: content };
  }

  try {
    const yaml = yamlMatch[1];
    const frontmatter: Record<string, unknown> = {};

    // Simple YAML parser for key-value pairs
    const lines = yaml.split("\n");
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        // Handle arrays (basic support)
        if (value.startsWith("[") && value.endsWith("]")) {
          frontmatter[key] = value
            .slice(1, -1)
            .split(",")
            .map((v) => v.trim());
        } else {
          frontmatter[key] = value.trim();
        }
      }
    }

    const validated = schema.parse(frontmatter);
    return {
      frontmatter: validated,
      body: content.replace(/^---\n[\s\S]*?\n---\n?/, ""),
    };
  } catch {
    return { body: content };
  }
};

/**
 * Build YAML frontmatter from an object
 */
export const buildFrontmatter = (data: Record<string, unknown>): string => {
  let frontmatter = "---\n";

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      frontmatter += `${key}: [${value.join(", ")}]\n`;
    } else {
      frontmatter += `${key}: ${value}\n`;
    }
  }

  frontmatter += "---\n";
  return frontmatter;
};

/**
 * Build skill content with frontmatter
 */
export const buildSkillContent = (
  name: string,
  description: string,
  license: string | undefined,
  compatibility: string | undefined,
  body: string
): string => {
  // Normalize the name
  const normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/-+/g, "-"); // Replace consecutive hyphens with single hyphen

  const frontmatterData: Record<string, string> = {
    name: normalizedName,
    description,
  };

  if (license) {
    frontmatterData.license = license;
  }
  if (compatibility) {
    frontmatterData.compatibility = compatibility;
  }

  return `${buildFrontmatter(frontmatterData)}\n${body}`;
};

/**
 * Validate skill content
 */
export const validateSkillContent = (
  content: string
): {
  valid: boolean;
  errors: string[];
  frontmatter?: SkillFrontmatter;
  body?: string;
} => {
  const errors: string[] = [];

  const parsed = parseFrontmatter(content, skillFrontmatterSchema);

  if (!parsed.frontmatter) {
    errors.push("Missing or invalid frontmatter");
    return { valid: false, errors };
  }

  // Validate frontmatter
  const result = skillFrontmatterSchema.safeParse(parsed.frontmatter);
  if (!result.success) {
    errors.push(
      ...result.error.issues.map(
        (e: any) => `${e.path.join(".")}: ${e.message}`
      )
    );
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    frontmatter: result.data,
    body: parsed.body,
  };
};
