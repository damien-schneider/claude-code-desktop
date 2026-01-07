/**
 * Pragmatic tests for Claude schema validation
 * Tests actual schema behavior with real data parsing
 */
import { describe, expect, it } from "vitest";
import {
  claudeModelSchema,
  claudeNameSchema,
  colorSchema,
  stringArraySchema,
} from "@/schemas/claude/base";
import {
  buildRuleContent,
  parseRuleContent,
  ruleFormSchema,
  ruleFrontmatterSchema,
} from "@/schemas/claude/rule.schema";
import {
  buildSkillContent,
  parseSkillContent,
  skillFrontmatterSchema,
} from "@/schemas/claude/skill.schema";

describe("Skill Schema", () => {
  describe("skillFrontmatterSchema", () => {
    it("should validate valid skill frontmatter", () => {
      const result = skillFrontmatterSchema.safeParse({
        name: "test-skill",
        description: "A test skill",
      });
      expect(result.success).toBe(true);
    });

    it("should require name field", () => {
      const result = skillFrontmatterSchema.safeParse({
        description: "A test skill",
      });
      expect(result.success).toBe(false);
    });

    it("should require description field", () => {
      const result = skillFrontmatterSchema.safeParse({
        name: "test-skill",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional license and compatibility", () => {
      const result = skillFrontmatterSchema.safeParse({
        name: "test-skill",
        description: "A test skill",
        license: "MIT",
        compatibility: "claude-3.5+",
      });
      expect(result.success).toBe(true);
    });

    it("should enforce max length on description", () => {
      const result = skillFrontmatterSchema.safeParse({
        name: "test-skill",
        description: "x".repeat(1025),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("buildSkillContent", () => {
    it("should build skill content with frontmatter", () => {
      const content = buildSkillContent({
        name: "test-skill",
        description: "A test skill",
        content: "# Instructions\n\nDo something",
      });

      expect(content).toContain("---");
      expect(content).toContain("name: test-skill");
      expect(content).toContain("description: A test skill");
      expect(content).toContain("# Instructions");
    });

    it("should normalize skill names", () => {
      const content = buildSkillContent({
        name: "Test Skill With Spaces!",
        description: "Test",
      });

      expect(content).toContain("name: test-skill-with-spaces");
    });

    it("should handle special characters in names", () => {
      const content = buildSkillContent({
        name: "Test@#$Skill",
        description: "Test",
      });

      expect(content).toContain("name: test-skill");
    });

    it("should include license when provided", () => {
      const content = buildSkillContent({
        name: "test-skill",
        description: "Test",
        license: "MIT",
      });

      expect(content).toContain("license: MIT");
    });

    it("should include compatibility when provided", () => {
      const content = buildSkillContent({
        name: "test-skill",
        description: "Test",
        compatibility: "claude-3.5+",
      });

      expect(content).toContain("compatibility: claude-3.5+");
    });
  });

  describe("parseSkillContent", () => {
    it("should parse valid skill frontmatter", () => {
      const content = `---
name: test-skill
description: A test skill
---

# Instructions

Do something`;

      const result = parseSkillContent(content);
      expect(result.frontmatter?.name).toBe("test-skill");
      expect(result.frontmatter?.description).toBe("A test skill");
      expect(result.body).toContain("# Instructions");
    });

    it("should handle content without frontmatter", () => {
      const content = "# Instructions\n\nDo something";
      const result = parseSkillContent(content);

      expect(result.frontmatter).toBeUndefined();
      expect(result.body).toBe(content);
    });

    it("should extract license from frontmatter", () => {
      const content = `---
name: test-skill
description: Test
license: MIT
---

Content`;

      const result = parseSkillContent(content);
      expect(result.frontmatter?.license).toBe("MIT");
    });

    it("should handle quoted description values", () => {
      const content = `---
name: test-skill
description: "A quoted description"
---

Content`;

      const result = parseSkillContent(content);
      expect(result.frontmatter?.description).toBe("A quoted description");
    });
  });
});

describe("Rule Schema", () => {
  describe("ruleFrontmatterSchema", () => {
    it("should validate valid rule frontmatter", () => {
      const result = ruleFrontmatterSchema.safeParse({
        name: "my-rule",
        description: "A test rule",
        priority: "high",
        category: "testing",
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty frontmatter", () => {
      const result = ruleFrontmatterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate priority enum", () => {
      const validPriorities = ["low", "medium", "high"] as const;

      validPriorities.forEach((priority) => {
        const result = ruleFrontmatterSchema.safeParse({ priority });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid priority", () => {
      const result = ruleFrontmatterSchema.safeParse({
        priority: "urgent",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ruleFormSchema", () => {
    it("should require non-empty content", () => {
      const result = ruleFormSchema.safeParse({
        content: "Some rule content",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty content", () => {
      const result = ruleFormSchema.safeParse({
        content: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("parseRuleContent", () => {
    it("should parse rule with frontmatter", () => {
      const content = `---
name: my-rule
priority: high
---

## When this rule applies
- Always

## The rule
- Do something`;

      const result = parseRuleContent(content);
      expect(result.hasFrontmatter).toBe(true);
      expect(result.frontmatter?.name).toBe("my-rule");
      expect(result.frontmatter?.priority).toBe("high");
      expect(result.body).toContain("When this rule applies");
    });

    it("should parse rule without frontmatter", () => {
      const content = "## The rule\n- Do something";
      const result = parseRuleContent(content);

      expect(result.hasFrontmatter).toBe(false);
      expect(result.frontmatter).toBeUndefined();
      expect(result.body).toBe(content);
    });

    it("should extract category from frontmatter", () => {
      const content = `---
category: testing
---

Content`;

      const result = parseRuleContent(content);
      expect(result.frontmatter?.category).toBe("testing");
    });
  });

  describe("buildRuleContent", () => {
    it("should build rule with frontmatter", () => {
      const result = buildRuleContent(
        { name: "my-rule", priority: "high" },
        "Rule content"
      );

      expect(result).toContain("---");
      expect(result).toContain("name: my-rule");
      expect(result).toContain("priority: high");
      expect(result).toContain("Rule content");
    });

    it("should return body only when no frontmatter", () => {
      const result = buildRuleContent(undefined, "Rule content");
      expect(result).toBe("Rule content");
    });

    it("should return body only when frontmatter is empty", () => {
      const result = buildRuleContent({}, "Rule content");
      expect(result).toBe("Rule content");
    });
  });
});

describe("Base Schema Validation", () => {
  describe("claudeNameSchema", () => {
    const validNames = [
      "my-rule",
      "test-123",
      "rule",
      "a",
      "test-rule-name-123",
      "my-rule-1",
    ];

    const invalidNames = [
      "",
      "A",
      "My_Rule",
      "-my-rule",
      "my-rule-",
      "my--rule",
      "my_rule",
      "my rule",
      "a".repeat(65),
    ];

    it("should accept valid names", () => {
      validNames.forEach((name) => {
        const result = claudeNameSchema.safeParse(name);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid names", () => {
      invalidNames.forEach((name) => {
        const result = claudeNameSchema.safeParse(name);
        expect(result.success).toBe(false);
      });
    });

    it("should handle edge case of exactly 64 characters", () => {
      const name = "a".repeat(64);
      const result = claudeNameSchema.safeParse(name);
      expect(result.success).toBe(true);
    });
  });

  describe("colorSchema", () => {
    const validColors = [
      "blue",
      "green",
      "red",
      "#fff",
      "#ffffff",
      "#FFF",
      "#FFFFFF",
      "#abc",
      "rgb(255, 0, 0)",
      "rgb(100%, 0%, 0%)",
      "rgba(255, 0, 0, 0.5)",
      "hsl(120, 100%, 50%)",
      "hsla(120, 100%, 50%, 0.5)",
    ];

    const invalidColors = [
      "RGB(255, 0, 0)",
      "#ggg",
      "notacolor123",
      "123",
      "#",
      "rgb(",
    ];

    it("should accept valid colors", () => {
      validColors.forEach((color) => {
        const result = colorSchema.safeParse(color);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid colors", () => {
      invalidColors.forEach((color) => {
        const result = colorSchema.safeParse(color);
        expect(result.success).toBe(false);
      });
    });

    it("should accept undefined as optional", () => {
      const result = colorSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty string", () => {
      const result = colorSchema.safeParse("");
      expect(result.success).toBe(true);
    });
  });

  describe("claudeModelSchema", () => {
    it("should accept valid model names", () => {
      const validModels = [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
      ];

      validModels.forEach((model) => {
        const result = claudeModelSchema.safeParse(model);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid model names", () => {
      const invalidModels = ["gpt-4", "claude-2", "not-a-model", ""];

      invalidModels.forEach((model) => {
        const result = claudeModelSchema.safeParse(model);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("stringArraySchema", () => {
    it("should split comma-separated strings", () => {
      const result = stringArraySchema.safeParse("item1,item2,item3");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["item1", "item2", "item3"]);
      }
    });

    it("should trim whitespace from items", () => {
      const result = stringArraySchema.safeParse("item1, item2 , item3");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["item1", "item2", "item3"]);
      }
    });

    it("should filter out empty strings", () => {
      const result = stringArraySchema.safeParse("item1,,item2");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["item1", "item2"]);
      }
    });

    it("should handle single item", () => {
      const result = stringArraySchema.safeParse("single");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["single"]);
      }
    });

    it("should accept undefined", () => {
      const result = stringArraySchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty string", () => {
      const result = stringArraySchema.safeParse("");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });
});

describe("Schema Edge Cases", () => {
  it("should handle Unicode characters in descriptions", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "test-skill",
      description: "Test with émojis 🎉 and ünicode",
    });
    expect(result.success).toBe(true);
  });

  it("should handle newlines in content", () => {
    const content = buildSkillContent({
      name: "test-skill",
      description: "Test",
      content: "Line 1\n\nLine 2\n\nLine 3",
    });

    expect(content).toContain("\n");
  });

  it("should handle special markdown characters", () => {
    const result = ruleFormSchema.safeParse({
      content: "# Heading\n\n- List item\n\n**Bold text**",
    });
    expect(result.success).toBe(true);
  });

  it("should handle empty frontmatter with just dashes", () => {
    const content = `---
---

Just content`;

    const result = parseSkillContent(content);
    expect(result.body).toContain("Just content");
  });
});
