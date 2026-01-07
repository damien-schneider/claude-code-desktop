/**
 * Pragmatic tests for rule schema
 * Tests actual schema validation and parsing behavior
 */
import { describe, expect, it } from "vitest";
import {
  buildRuleContent,
  parseRuleContent,
  ruleContentSchema,
  ruleCreateSchema,
  ruleFormSchema,
  ruleFrontmatterSchema,
} from "@/schemas/claude/rule.schema";

describe("ruleFrontmatterSchema", () => {
  it("should accept valid frontmatter", () => {
    const result = ruleFrontmatterSchema.safeParse({
      name: "my-rule",
      description: "A test rule",
      priority: "high",
      category: "testing",
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = ruleFrontmatterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should validate name with claudeNameSchema", () => {
    const result = ruleFrontmatterSchema.safeParse({
      name: "Invalid_Rule",
    });

    expect(result.success).toBe(false);
  });

  it("should reject description over 500 characters", () => {
    const result = ruleFrontmatterSchema.safeParse({
      description: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("should accept valid priority values", () => {
    const priorities = ["low", "medium", "high"] as const;

    priorities.forEach((priority) => {
      const result = ruleFrontmatterSchema.safeParse({ priority });
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid priority values", () => {
    const result = ruleFrontmatterSchema.safeParse({
      priority: "invalid",
    });

    expect(result.success).toBe(false);
  });
});

describe("ruleContentSchema", () => {
  it("should accept content with frontmatter and body", () => {
    const result = ruleContentSchema.safeParse({
      frontmatter: {
        name: "my-rule",
        description: "Test",
      },
      body: "Rule content here",
    });

    expect(result.success).toBe(true);
  });

  it("should accept content with only body", () => {
    const result = ruleContentSchema.safeParse({
      body: "Rule content here",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty body", () => {
    const result = ruleContentSchema.safeParse({
      body: "",
    });

    expect(result.success).toBe(false);
  });

  it("should reject missing body", () => {
    const result = ruleContentSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("ruleFormSchema", () => {
  it("should accept non-empty content", () => {
    const result = ruleFormSchema.safeParse({
      content: "Rule content",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = ruleFormSchema.safeParse({
      content: "",
    });

    expect(result.success).toBe(false);
  });

  it("should reject missing content", () => {
    const result = ruleFormSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("ruleCreateSchema", () => {
  it("should accept valid name", () => {
    const result = ruleCreateSchema.safeParse({
      name: "my-rule",
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = ruleCreateSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("should validate name with claudeNameSchema", () => {
    const result = ruleCreateSchema.safeParse({
      name: "Invalid_Rule",
    });

    expect(result.success).toBe(false);
  });
});

describe("parseRuleContent", () => {
  it("should parse rule with frontmatter", () => {
    const content = `---
name: my-rule
description: A test rule
priority: high
---
Rule content here`;

    const result = parseRuleContent(content);

    expect(result.hasFrontmatter).toBe(true);
    expect(result.frontmatter?.name).toBe("my-rule");
    expect(result.frontmatter?.description).toBe("A test rule");
    expect(result.frontmatter?.priority).toBe("high");
    expect(result.body).toBe("Rule content here");
  });

  it("should parse rule without frontmatter", () => {
    const content = "Just rule content";

    const result = parseRuleContent(content);

    expect(result.hasFrontmatter).toBe(false);
    expect(result.frontmatter).toBeUndefined();
    expect(result.body).toBe("Just rule content");
  });

  it("should handle quoted description values", () => {
    const content = `---
description: "A quoted description"
---
Content`;

    const result = parseRuleContent(content);

    expect(result.frontmatter?.description).toBe("A quoted description");
  });

  it("should handle single-quoted description values", () => {
    const content = `---
description: 'A single-quoted description'
---
Content`;

    const result = parseRuleContent(content);

    expect(result.frontmatter?.description).toBe("A single-quoted description");
  });

  it("should handle frontmatter with only name", () => {
    const content = `---
name: my-rule
---
Content`;

    const result = parseRuleContent(content);

    expect(result.frontmatter?.name).toBe("my-rule");
    expect(result.frontmatter?.description).toBeUndefined();
  });

  it("should handle multiline body content", () => {
    const content = `---
name: my-rule
---
First line
Second line
Third line`;

    const result = parseRuleContent(content);

    expect(result.body).toContain("First line");
    expect(result.body).toContain("Second line");
    expect(result.body).toContain("Third line");
  });
});

describe("buildRuleContent", () => {
  it("should build content with frontmatter", () => {
    const frontmatter = {
      name: "my-rule",
      description: "A test rule",
    };
    const body = "Rule content";

    const result = buildRuleContent(frontmatter, body);

    expect(result).toContain("---");
    expect(result).toContain("name: my-rule");
    expect(result).toContain("description: A test rule");
    expect(result).toContain("Rule content");
  });

  it("should return body only when no frontmatter", () => {
    const result = buildRuleContent(undefined, "Just content");

    expect(result).toBe("Just content");
    expect(result).not.toContain("---");
  });

  it("should return body only when frontmatter is empty", () => {
    const result = buildRuleContent({}, "Just content");

    expect(result).toBe("Just content");
    expect(result).not.toContain("---");
  });

  it("should skip undefined values in frontmatter", () => {
    const frontmatter = {
      name: "my-rule",
      description: undefined,
      priority: "high" as const,
    };

    const result = buildRuleContent(frontmatter, "Content");

    expect(result).toContain("name: my-rule");
    expect(result).toContain("priority: high");
    expect(result).not.toContain("description:");
  });

  it("should format frontmatter correctly", () => {
    const result = buildRuleContent(
      { name: "test", description: "desc" },
      "body"
    );

    expect(result).toMatch(/^---\nname: test\ndescription: desc\n---\n\nbody$/);
  });
});
