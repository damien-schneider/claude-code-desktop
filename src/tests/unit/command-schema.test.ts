/**
 * Pragmatic tests for command schema
 * Tests actual schema validation and helper functions
 */
import { describe, expect, it } from "vitest";
import {
  buildCommandContent,
  commandContentSchema,
  commandCreateSchema,
  commandFormSchema,
  commandFrontmatterSchema,
  parseCommandContent,
  validateCommandStructure,
} from "@/schemas/claude/command.schema";

describe("commandFrontmatterSchema", () => {
  it("should accept valid frontmatter", () => {
    const result = commandFrontmatterSchema.safeParse({
      description: "A test command",
    });

    expect(result.success).toBe(true);
  });

  it("should accept frontmatter with optional fields", () => {
    const result = commandFrontmatterSchema.safeParse({
      description: "A test command",
      category: "testing",
      enabled: true,
      arguments: [
        {
          name: "path",
          description: "File path",
          required: true,
          type: "string",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("should require description", () => {
    const result = commandFrontmatterSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("should reject empty description", () => {
    const result = commandFrontmatterSchema.safeParse({
      description: "",
    });

    expect(result.success).toBe(false);
  });

  it("should reject description over 500 characters", () => {
    const result = commandFrontmatterSchema.safeParse({
      description: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("should accept all argument types", () => {
    const types = ["string", "number", "boolean", "array"] as const;

    for (const type of types) {
      const result = commandFrontmatterSchema.safeParse({
        description: "Test",
        arguments: [{ name: "test", type }],
      });

      expect(result.success).toBe(true);
    }
  });
});

describe("commandContentSchema", () => {
  it("should accept content with frontmatter and body containing $ARGUMENTS", () => {
    const result = commandContentSchema.safeParse({
      frontmatter: {
        description: "A test command",
      },
      body: "Command instructions\n\n$ARGUMENTS\n\nMore text",
    });

    expect(result.success).toBe(true);
  });

  it("should reject body without $ARGUMENTS placeholder", () => {
    const result = commandContentSchema.safeParse({
      frontmatter: {
        description: "A test command",
      },
      body: "Command instructions without placeholder",
    });

    expect(result.success).toBe(false);
  });

  it("should require frontmatter", () => {
    const result = commandContentSchema.safeParse({
      body: "Instructions\n\n$ARGUMENTS",
    });

    expect(result.success).toBe(false);
  });
});

describe("commandFormSchema", () => {
  it("should accept valid command name", () => {
    const result = commandFormSchema.safeParse({
      name: "my-command",
    });

    expect(result.success).toBe(true);
  });

  it("should validate name with claudeNameSchema", () => {
    const result = commandFormSchema.safeParse({
      name: "Invalid_Command",
    });

    expect(result.success).toBe(false);
  });

  it("should require name", () => {
    const result = commandFormSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("commandCreateSchema", () => {
  it("should accept valid command name", () => {
    const result = commandCreateSchema.safeParse({
      name: "my-command",
    });

    expect(result.success).toBe(true);
  });

  it("should validate name with claudeNameSchema", () => {
    const result = commandCreateSchema.safeParse({
      name: "Invalid_Command",
    });

    expect(result.success).toBe(false);
  });
});

describe("buildCommandContent", () => {
  it("should build command with description", () => {
    const result = buildCommandContent("test-command", "A test command");

    expect(result).toContain("---");
    expect(result).toContain("description: A test command");
    expect(result).toContain("# test-command");
    expect(result).toContain("$ARGUMENTS");
    expect(result).toContain("## Instructions");
  });

  it("should build command with default description", () => {
    const result = buildCommandContent("test-command");

    expect(result).toContain("description: My custom command");
  });

  it("should include all sections", () => {
    const result = buildCommandContent("test");

    expect(result).toContain("# test");
    expect(result).toContain("$ARGUMENTS");
    expect(result).toContain("## Instructions");
    expect(result).toContain("## Steps");
    expect(result).toContain("1. First step");
    expect(result).toContain("2. Second step");
    expect(result).toContain("3. Third step");
  });
});

describe("parseCommandContent", () => {
  it("should parse command with frontmatter", () => {
    const content = `---
description: A test command
category: testing
enabled: true
---
Command content here`;

    const result = parseCommandContent(content);

    expect(result.hasFrontmatter).toBe(true);
    expect(result.frontmatter?.description).toBe("A test command");
    expect(result.frontmatter?.category).toBe("testing");
    expect(result.frontmatter?.enabled).toBe(true);
    expect(result.body).toBe("Command content here");
    expect(result.rawFrontmatter).toBeDefined();
  });

  it("should parse command without frontmatter", () => {
    const content = "Just command content";

    const result = parseCommandContent(content);

    expect(result.hasFrontmatter).toBe(false);
    expect(result.frontmatter).toBeUndefined();
    expect(result.body).toBe("Just command content");
    expect(result.rawFrontmatter).toBeUndefined();
  });

  it("should extract raw frontmatter", () => {
    const content = `---
description: Test
category: testing
---

Body`;

    const result = parseCommandContent(content);

    expect(result.rawFrontmatter).toBe("description: Test\ncategory: testing");
  });

  it("should handle quoted descriptions", () => {
    const content = `---
description: "A quoted description"
---

Body`;

    const result = parseCommandContent(content);

    expect(result.frontmatter?.description).toBe("A quoted description");
  });

  it("should handle single-quoted descriptions", () => {
    const content = `---
description: 'A single-quoted description'
---

Body`;

    const result = parseCommandContent(content);

    expect(result.frontmatter?.description).toBe("A single-quoted description");
  });

  it("should handle enabled: false", () => {
    const content = `---
description: Test
enabled: false
---

Body`;

    const result = parseCommandContent(content);

    expect(result.frontmatter?.enabled).toBe(false);
  });
});

describe("validateCommandStructure", () => {
  it("should validate correct command structure", () => {
    const content = `---
description: Test
---

Instructions

$ARGUMENTS

More text`;

    const result = validateCommandStructure(content);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject empty content", () => {
    const result = validateCommandStructure("");

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Command content cannot be empty");
  });

  it("should reject whitespace-only content", () => {
    const result = validateCommandStructure("   \n  \n  ");

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Command content cannot be empty");
  });

  it("should reject content without frontmatter", () => {
    const content = "Instructions\n\n$ARGUMENTS";

    const result = validateCommandStructure(content);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("YAML frontmatter");
  });

  it("should reject content without $ARGUMENTS", () => {
    const content = `---
description: Test
---

Instructions only`;

    const result = validateCommandStructure(content);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("$ARGUMENTS");
  });

  it("should validate command with just frontmatter and $ARGUMENTS", () => {
    const content = `---
description: Test
---
$ARGUMENTS`;

    const result = validateCommandStructure(content);

    expect(result.valid).toBe(true);
  });
});
