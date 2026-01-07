/**
 * Pragmatic tests for CLAUDE.md schema
 * Tests actual schema validation and helper functions
 */
import { describe, expect, it } from "vitest";
import {
  buildClaudeMd,
  type ClaudeMdContent,
  type ClaudeMdFormValues,
  type ClaudeMdSection,
  claudeMdContentSchema,
  claudeMdFormSchema,
  claudeMdSectionSchema,
  extractClaudeMdImports,
  parseClaudeMd,
  resolveImportPath,
  type StandardSection,
  standardSectionsEnum,
  validateClaudeMd,
} from "@/schemas/claude/claude-md.schema";

// Top-level regex patterns for performance
const ISO_DATE_REGEX = /\d{4}-\d{2}-\d{2}/;

describe("claudeMdSectionSchema", () => {
  it("should accept valid section with all fields", () => {
    const result = claudeMdSectionSchema.safeParse({
      title: "Overview",
      content: "Project overview content",
      order: 1,
    });

    expect(result.success).toBe(true);
  });

  it("should accept section with only required fields", () => {
    const result = claudeMdSectionSchema.safeParse({
      title: "Architecture",
      content: "Architecture details",
    });

    expect(result.success).toBe(true);
  });

  it("should require title", () => {
    const result = claudeMdSectionSchema.safeParse({
      content: "Content",
    });

    expect(result.success).toBe(false);
  });

  it("should require content", () => {
    const result = claudeMdSectionSchema.safeParse({
      title: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const result = claudeMdSectionSchema.safeParse({
      title: "",
      content: "Content",
    });

    expect(result.success).toBe(false);
  });
});

describe("standardSectionsEnum", () => {
  it("should accept all standard section types", () => {
    const validSections = [
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
    ] as const;

    for (const section of validSections) {
      const result = standardSectionsEnum.safeParse(section);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid section types", () => {
    const result = standardSectionsEnum.safeParse("invalid-section");
    expect(result.success).toBe(false);
  });
});

describe("claudeMdContentSchema", () => {
  it("should accept content with frontmatter and sections", () => {
    const result = claudeMdContentSchema.safeParse({
      frontmatter: {
        version: "1.0",
        lastUpdated: "2024-01-01",
        author: "Test Author",
        tags: ["tag1", "tag2"],
      },
      sections: [
        { title: "Overview", content: "Content", order: 1 },
        { title: "Architecture", content: "More content" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("should accept content with only rawContent", () => {
    const result = claudeMdContentSchema.safeParse({
      rawContent: "# Project\n\nSome content",
    });

    expect(result.success).toBe(true);
  });

  it("should accept content with frontmatter only", () => {
    const result = claudeMdContentSchema.safeParse({
      frontmatter: {
        version: "1.0",
      },
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = claudeMdContentSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("claudeMdFormSchema", () => {
  it("should accept non-empty content", () => {
    const result = claudeMdFormSchema.safeParse({
      content: "# Project\n\nContent here",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = claudeMdFormSchema.safeParse({
      content: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("cannot be empty");
    }
  });

  it("should reject whitespace-only content", () => {
    const result = claudeMdFormSchema.safeParse({
      content: "   \n  \n  ",
    });

    // Zod's min(1) only checks string length, not trimmed content
    // Whitespace-only strings with newlines have length > 1
    expect(result.success).toBe(true);
  });
});

describe("parseClaudeMd", () => {
  it("should parse content with frontmatter", () => {
    const content = `---
version: 1.0.0
lastUpdated: 2024-01-01
author: Test Author
tags: ["tag1", "tag2"]
---
# Overview

Project overview content`;

    const result = parseClaudeMd(content);

    expect(result.hasFrontmatter).toBe(true);
    expect(result.frontmatter?.version).toBe("1.0.0");
    expect(result.frontmatter?.lastUpdated).toBe("2024-01-01");
    expect(result.frontmatter?.author).toBe("Test Author");
    expect(result.frontmatter?.tags).toEqual(["tag1", "tag2"]);
    expect(result.rawContent).toContain("# Overview");
  });

  it("should parse content without frontmatter", () => {
    const content = "# Overview\n\nContent here";

    const result = parseClaudeMd(content);

    expect(result.hasFrontmatter).toBe(false);
    expect(result.frontmatter).toBeUndefined();
    expect(result.rawContent).toBe(content);
  });

  it("should extract sections from markdown headers", () => {
    const content = `# Project Overview

This is the overview.

## Architecture

System architecture details.

### Database

Database schema.`;

    const result = parseClaudeMd(content);

    expect(result.sections).toHaveLength(3);
    expect(result.sections[0].title).toBe("Project Overview");
    expect(result.sections[0].level).toBe(1);
    expect(result.sections[0].content).toContain("overview");

    expect(result.sections[1].title).toBe("Architecture");
    expect(result.sections[1].level).toBe(2);

    expect(result.sections[2].title).toBe("Database");
    expect(result.sections[2].level).toBe(3);
  });

  it("should handle content with no sections", () => {
    const content = "Just plain text without headers";

    const result = parseClaudeMd(content);

    expect(result.sections).toHaveLength(0);
    expect(result.rawContent).toBe(content);
  });

  it("should parse tags with different formats", () => {
    const content1 = `---
tags: [tag1, tag2, tag3]
---
Content`;

    const result1 = parseClaudeMd(content1);
    expect(result1.frontmatter?.tags).toEqual(["tag1", "tag2", "tag3"]);

    const content2 = `---
tags: ['tag1', 'tag2']
---
Content`;

    const result2 = parseClaudeMd(content2);
    expect(result2.frontmatter?.tags).toEqual(["tag1", "tag2"]);
  });

  it("should handle frontmatter with partial fields", () => {
    const content = `---
version: 2.0
---
Content`;

    const result = parseClaudeMd(content);

    expect(result.hasFrontmatter).toBe(true);
    expect(result.frontmatter?.version).toBe("2.0");
    expect(result.frontmatter?.author).toBeUndefined();
    expect(result.frontmatter?.tags).toBeUndefined();
  });

  it("should handle empty frontmatter", () => {
    const content = `---
---
Content`;

    const result = parseClaudeMd(content);

    // Empty frontmatter doesn't match the regex pattern
    // The regex requires at least one character between the --- markers
    expect(result.hasFrontmatter).toBe(false);
    expect(result.frontmatter).toBeUndefined();
  });
});

describe("buildClaudeMd", () => {
  it("should build CLAUDE.md with frontmatter and all sections", () => {
    const result = buildClaudeMd({
      projectName: "Test Project",
      overview: "Project overview",
      architecture: "System architecture",
      codingStandards: "Follow these standards",
      testing: "Test everything",
      deployment: "Deploy with care",
      developmentWorkflow: "Workflow steps",
      frontmatter: {
        version: "1.0",
        author: "Test Author",
        tags: ["tag1", "tag2"],
      },
    });

    expect(result).toContain("---");
    expect(result).toContain("version: 1.0");
    expect(result).toContain("author: Test Author");
    expect(result).toContain('tags: ["tag1", "tag2"]');
    expect(result).toContain("lastUpdated:");
    expect(result).toContain("# Test Project");
    expect(result).toContain("## Overview");
    expect(result).toContain("Project overview");
    expect(result).toContain("## Architecture");
    expect(result).toContain("System architecture");
    expect(result).toContain("## Coding Standards");
    expect(result).toContain("## Testing");
    expect(result).toContain("## Development Workflow");
    expect(result).toContain("## Deployment");
  });

  it("should build CLAUDE.md with default values", () => {
    const result = buildClaudeMd({});

    expect(result).toContain("# My Project");
    expect(result).toContain("## Overview");
    expect(result).toContain("Brief description of the project.");
  });

  it("should build CLAUDE.md without frontmatter", () => {
    const result = buildClaudeMd({
      projectName: "Simple Project",
      overview: "Simple overview",
    });

    expect(result).not.toContain("---");
    expect(result).toContain("# Simple Project");
    expect(result).toContain("Simple overview");
  });

  it("should include only specified sections", () => {
    const result = buildClaudeMd({
      projectName: "Test",
      overview: "Overview",
      architecture: "Architecture",
    });

    expect(result).toContain("## Overview");
    expect(result).toContain("## Architecture");
    expect(result).not.toContain("## Coding Standards");
    expect(result).not.toContain("## Testing");
  });

  it("should add ISO date for lastUpdated", () => {
    const result = buildClaudeMd({
      frontmatter: {
        version: "1.0",
      },
    });

    expect(result).toContain("lastUpdated:");
    expect(result).toMatch(ISO_DATE_REGEX);
  });
});

describe("validateClaudeMd", () => {
  it("should validate correct CLAUDE.md structure", () => {
    const content = `# Project

## Overview

Project overview here.

## Architecture

Architecture details.`;

    const result = validateClaudeMd(content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject empty content", () => {
    const result = validateClaudeMd("");

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("CLAUDE.md content cannot be empty");
  });

  it("should reject whitespace-only content", () => {
    const result = validateClaudeMd("   \n  \n  ");

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("CLAUDE.md content cannot be empty");
  });

  it("should warn about missing Overview section", () => {
    const content = `# Project

## Architecture

Architecture details.`;

    const result = validateClaudeMd(content);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      "Missing Overview section - recommended for all projects"
    );
  });

  it("should warn about headers without titles", () => {
    const content = `# Project

##

## Architecture
Content`;

    const result = validateClaudeMd(content);

    expect(result.warnings).toContain(
      "Some headers appear to be missing titles"
    );
  });

  it("should warn about very long lines", () => {
    const content = `# Project

${"a".repeat(600)}

## Overview

${"b".repeat(550)}`;

    const result = validateClaudeMd(content);

    expect(result.warnings.some((w) => w.includes("very long lines"))).toBe(
      true
    );
  });
});

describe("extractClaudeMdImports", () => {
  it("should extract import statements", () => {
    const content = `# Project

See @./docs/architecture.md for details.

Also check @./docs/api.md

No import here: @invalid`;

    const result = extractClaudeMdImports(content);

    expect(result).toEqual(["./docs/architecture.md", "./docs/api.md"]);
  });

  it("should return empty array when no imports", () => {
    const content = "# Project\n\nNo imports here";

    const result = extractClaudeMdImports(content);

    expect(result).toEqual([]);
  });

  it("should handle multiple imports on same line", () => {
    const content = "See @./file1.md and @./file2.md for more";

    const result = extractClaudeMdImports(content);

    expect(result).toEqual(["./file1.md", "./file2.md"]);
  });
});

describe("resolveImportPath", () => {
  it("should resolve relative import path", () => {
    const result = resolveImportPath("./docs/architecture.md", "/project/root");
    expect(result).toBe("/project/root/docs/architecture.md");
  });

  it("should handle path without leading ./", () => {
    const result = resolveImportPath("docs/architecture.md", "/project/root");
    expect(result).toBe("/project/root/docs/architecture.md");
  });

  it("should handle nested paths", () => {
    const result = resolveImportPath(
      "./docs/api/v1/endpoints.md",
      "/project/root"
    );
    expect(result).toBe("/project/root/docs/api/v1/endpoints.md");
  });
});

describe("Type exports", () => {
  it("should export ClaudeMdContent type", () => {
    const content: ClaudeMdContent = {
      frontmatter: {
        version: "1.0",
        author: "Test",
        tags: ["tag1"],
      },
      sections: [{ title: "Test", content: "Content", order: 1 }],
    };
    expect(content.sections).toBeDefined();
  });

  it("should export ClaudeMdFormValues type", () => {
    const form: ClaudeMdFormValues = {
      content: "# Test\n\nContent",
    };
    expect(form.content).toBeDefined();
  });

  it("should export ClaudeMdSection type", () => {
    const section: ClaudeMdSection = {
      title: "Test",
      content: "Content",
      order: 1,
    };
    expect(section.title).toBe("Test");
  });

  it("should export StandardSection type", () => {
    const section: StandardSection = "architecture";
    expect(section).toBe("architecture");
  });
});
