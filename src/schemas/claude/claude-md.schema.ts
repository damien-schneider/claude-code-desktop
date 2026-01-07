/**
 * CLAUDE.md Schema - Validates Claude project instruction files
 *
 * CLAUDE.md files provide project-specific context and instructions to Claude.
 * They are automatically loaded by Claude Code when working in a project.
 *
 * Reference: https://docs.anthropic.com/en/docs/build-with-claude/project-instructions
 */

import { z } from "zod";

// Top-level regex patterns for performance
const FRONTMATTER_WITH_BODY_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
const VERSION_REGEX = /^version:\s*(.+)$/m;
const LAST_UPDATED_REGEX = /^lastUpdated:\s*(.+)$/m;
const AUTHOR_REGEX = /^author:\s*(.+)$/m;
const TAGS_REGEX = /^tags:\s*\[(.*?)\]$/m;
const HEADER_REGEX = /^(#{1,6})\s+(.+)$/;
const OVERVIEW_REGEX = /##?\s*Overview/i;
const ARCHITECTURE_REGEX = /##?\s*Architecture/i;
const LEADING_DOT_SLASH_REGEX = /^\.\//;

/**
 * CLAUDE.md section types
 */
export const claudeMdSectionSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  order: z.number().optional(),
});

/**
 * Standard CLAUDE.md sections
 * These are the common sections found in well-structured CLAUDE.md files
 */
export const standardSectionsEnum = z.enum([
  "overview",
  "architecture",
  "coding-standards",
  "testing",
  "deployment",
  "development-workflow",
  "documentation",
  "troubleshooting",
  "glossary",
  "appendix",
]);

/**
 * CLAUDE.md content structure
 * Validates the overall structure with frontmatter (optional) and sections
 */
export const claudeMdContentSchema = z.object({
  // Optional YAML frontmatter
  frontmatter: z
    .object({
      version: z.string().optional(),
      lastUpdated: z.string().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),

  // Main content sections
  sections: z.array(claudeMdSectionSchema).optional(),

  // Raw markdown content (when sections aren't parsed)
  rawContent: z.string().optional(),
});

/**
 * Form schema for editing CLAUDE.md
 * Simplified for the UI
 */
export const claudeMdFormSchema = z.object({
  content: z.string().min(1, "CLAUDE.md content cannot be empty"),
});

/**
 * Helper to parse CLAUDE.md file
 * Extracts frontmatter if present and returns structured content
 */
export function parseClaudeMd(content: string): {
  frontmatter?: {
    version?: string;
    lastUpdated?: string;
    author?: string;
    tags?: string[];
  };
  sections: Array<{ title: string; content: string; level: number }>;
  rawContent: string;
  hasFrontmatter: boolean;
} {
  const frontmatterMatch = content.match(FRONTMATTER_WITH_BODY_REGEX);

  // biome-ignore lint/suspicious/noExplicitAny: Required for JSON schema validation
  const frontmatter: Record<string, any> = {};
  let rawContent = content;
  let hasFrontmatter = false;

  if (frontmatterMatch) {
    hasFrontmatter = true;
    rawContent = frontmatterMatch[2];

    // Parse YAML frontmatter
    const yaml = frontmatterMatch[1];
    const versionMatch = yaml.match(VERSION_REGEX);
    const lastUpdatedMatch = yaml.match(LAST_UPDATED_REGEX);
    const authorMatch = yaml.match(AUTHOR_REGEX);
    const tagsMatch = yaml.match(TAGS_REGEX);

    if (versionMatch) {
      frontmatter.version = versionMatch[1].trim();
    }
    if (lastUpdatedMatch) {
      frontmatter.lastUpdated = lastUpdatedMatch[1].trim();
    }
    if (authorMatch) {
      frontmatter.author = authorMatch[1].trim();
    }
    if (tagsMatch) {
      frontmatter.tags = tagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }
  }

  // Extract sections by parsing headers
  const sections: Array<{ title: string; content: string; level: number }> = [];
  const lines = rawContent.split("\n");
  let currentSection: { title: string; content: string; level: number } | null =
    null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(HEADER_REGEX);

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: currentContent.join("\n").trim(),
        });
      }

      // Start new section
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      currentSection = { title, content: "", level };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections.push({
      ...currentSection,
      content: currentContent.join("\n").trim(),
    });
  }

  return {
    frontmatter: Object.keys(frontmatter).length > 0 ? frontmatter : undefined,
    sections,
    rawContent,
    hasFrontmatter,
  };
}

/**
 * Helper to build CLAUDE.md content
 * Creates a well-structured CLAUDE.md file with standard sections
 */
export function buildClaudeMd(options: {
  projectName?: string;
  overview?: string;
  architecture?: string;
  codingStandards?: string;
  testing?: string;
  deployment?: string;
  developmentWorkflow?: string;
  frontmatter?: {
    version?: string;
    author?: string;
    tags?: string[];
  };
}): string {
  const {
    projectName = "My Project",
    overview = "Brief description of the project.",
    architecture = "",
    codingStandards = "",
    testing = "",
    deployment = "",
    developmentWorkflow = "",
    frontmatter,
  } = options;

  let content = "";

  // Add frontmatter if provided
  if (frontmatter && Object.keys(frontmatter).length > 0) {
    content += "---\n";
    if (frontmatter.version) {
      content += `version: ${frontmatter.version}\n`;
    }
    if (frontmatter.author) {
      content += `author: ${frontmatter.author}\n`;
    }
    if (frontmatter.tags && frontmatter.tags.length > 0) {
      content += `tags: [${frontmatter.tags.map((t) => `"${t}"`).join(", ")}]\n`;
    }
    content += `lastUpdated: ${new Date().toISOString().split("T")[0]}\n`;
    content += "---\n\n";
  }

  // Add sections
  content += `# ${projectName}\n\n`;
  content += `## Overview\n\n${overview}\n\n`;

  if (architecture) {
    content += `## Architecture\n\n${architecture}\n\n`;
  }

  if (codingStandards) {
    content += `## Coding Standards\n\n${codingStandards}\n\n`;
  }

  if (testing) {
    content += `## Testing\n\n${testing}\n\n`;
  }

  if (developmentWorkflow) {
    content += `## Development Workflow\n\n${developmentWorkflow}\n\n`;
  }

  if (deployment) {
    content += `## Deployment\n\n${deployment}\n\n`;
  }

  return content;
}

/**
 * Helper to validate CLAUDE.md structure
 */
export function validateClaudeMd(content: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.trim()) {
    errors.push("CLAUDE.md content cannot be empty");
  }

  // Check for common sections
  const hasOverview = OVERVIEW_REGEX.test(content);
  const _hasArchitecture = ARCHITECTURE_REGEX.test(content);

  if (!hasOverview) {
    warnings.push("Missing Overview section - recommended for all projects");
  }

  // Check for proper markdown heading format
  const invalidHeaders = content.match(/^(#+\s*)$/gm);
  if (invalidHeaders) {
    warnings.push("Some headers appear to be missing titles");
  }

  // Check for very long lines that might indicate formatting issues
  const lines = content.split("\n");
  const veryLongLines = lines.filter((line) => line.length > 500);
  if (veryLongLines.length > 0) {
    warnings.push(
      `Found ${veryLongLines.length} very long lines that might need formatting`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Helper to extract imports from CLAUDE.md
 * Finds @./path/to/file.md import statements
 */
export function extractClaudeMdImports(content: string): string[] {
  const importRegex = /@([^\s\n]+\.md)/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null = importRegex.exec(content);

  while (match !== null) {
    imports.push(match[1]);
    match = importRegex.exec(content);
  }

  return imports;
}

/**
 * Helper to resolve import paths
 * Converts relative import paths to absolute paths based on project root
 */
export function resolveImportPath(
  importPath: string,
  projectRoot: string
): string {
  // Remove leading ./
  const relativePath = importPath.replace(LEADING_DOT_SLASH_REGEX, "");
  return `${projectRoot}/${relativePath}`;
}

/**
 * Type exports
 */
export type ClaudeMdContent = z.infer<typeof claudeMdContentSchema>;
export type ClaudeMdFormValues = z.infer<typeof claudeMdFormSchema>;
export type ClaudeMdSection = z.infer<typeof claudeMdSectionSchema>;
export type StandardSection = z.infer<typeof standardSectionsEnum>;
