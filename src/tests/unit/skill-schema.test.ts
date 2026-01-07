/**
 * Pragmatic tests for skill schema
 * Tests actual schema validation and parsing behavior
 */
import { describe, expect, it } from "vitest";
import {
  buildSkillContent,
  parseSkillContent,
  skillContentSchema,
  skillCreateSchema,
  skillFormSchema,
  skillFrontmatterSchema,
} from "@/schemas/claude/skill.schema";

describe("skillFrontmatterSchema", () => {
  it("should accept valid frontmatter", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
      description: "A test skill",
      license: "MIT",
      compatibility: "All Claude models",
    });

    expect(result.success).toBe(true);
  });

  it("should accept frontmatter without optional fields", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
      description: "A test skill",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = skillFrontmatterSchema.safeParse({
      description: "A test skill",
    });

    expect(result.success).toBe(false);
  });

  it("should require description", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty description", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
      description: "",
    });

    expect(result.success).toBe(false);
  });

  it("should reject description over 1024 characters", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
      description: "a".repeat(1025),
    });

    expect(result.success).toBe(false);
  });

  it("should reject license over 200 characters", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
      description: "Test",
      license: "a".repeat(201),
    });

    expect(result.success).toBe(false);
  });

  it("should reject compatibility over 500 characters", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
      description: "Test",
      compatibility: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("should validate name with claudeNameSchema", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "Invalid_Skill",
      description: "Test",
    });

    expect(result.success).toBe(false);
  });
});

describe("skillContentSchema", () => {
  it("should accept content with frontmatter and body", () => {
    const result = skillContentSchema.safeParse({
      frontmatter: {
        name: "my-skill",
        description: "A test skill",
      },
      body: "Skill content here",
    });

    expect(result.success).toBe(true);
  });

  it("should accept content with only frontmatter", () => {
    const result = skillContentSchema.safeParse({
      frontmatter: {
        name: "my-skill",
        description: "A test skill",
      },
    });

    expect(result.success).toBe(true);
  });

  it("should require frontmatter", () => {
    const result = skillContentSchema.safeParse({
      body: "Content",
    });

    expect(result.success).toBe(false);
  });
});

describe("skillFormSchema", () => {
  it("should accept valid form data", () => {
    const result = skillFormSchema.safeParse({
      name: "my-skill",
      description: "A test skill",
      license: "MIT",
      compatibility: "All models",
      content: "Skill content",
    });

    expect(result.success).toBe(true);
  });

  it("should accept form without optional fields", () => {
    const result = skillFormSchema.safeParse({
      name: "my-skill",
      description: "A test skill",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = skillFormSchema.safeParse({
      description: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("should require description", () => {
    const result = skillFormSchema.safeParse({
      name: "my-skill",
    });

    expect(result.success).toBe(false);
  });
});

describe("skillCreateSchema", () => {
  it("should accept valid name", () => {
    const result = skillCreateSchema.safeParse({
      name: "my-skill",
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = skillCreateSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("should validate name with claudeNameSchema", () => {
    const result = skillCreateSchema.safeParse({
      name: "Invalid_Skill",
    });

    expect(result.success).toBe(false);
  });
});

describe("buildSkillContent", () => {
  it("should build content with all fields", () => {
    const values = {
      name: "my-skill",
      description: "A test skill",
      license: "MIT",
      compatibility: "All models",
      content: "Skill content here",
    };

    const result = buildSkillContent(values);

    expect(result).toContain("---");
    expect(result).toContain("name: my-skill");
    expect(result).toContain("description: A test skill");
    expect(result).toContain("license: MIT");
    expect(result).toContain("compatibility: All models");
    expect(result).toContain("Skill content here");
  });

  it("should build content without optional fields", () => {
    const values = {
      name: "my-skill",
      description: "A test skill",
      content: "Content",
    };

    const result = buildSkillContent(values);

    expect(result).toContain("name: my-skill");
    expect(result).toContain("description: A test skill");
    expect(result).not.toContain("license:");
    expect(result).not.toContain("compatibility:");
  });

  it("should normalize name to lowercase", () => {
    const values = {
      name: "MySkill",
      description: "Test",
      content: "Content",
    };

    const result = buildSkillContent(values);

    expect(result).toContain("name: myskill");
  });

  it("should replace special characters with hyphens", () => {
    const values = {
      name: "my@skill#test",
      description: "Test",
      content: "Content",
    };

    const result = buildSkillContent(values);

    expect(result).toContain("name: my-skill-test");
  });

  it("should remove leading and trailing hyphens", () => {
    const values = {
      name: "-my-skill-",
      description: "Test",
      content: "Content",
    };

    const result = buildSkillContent(values);

    expect(result).toContain("name: my-skill");
  });

  it("should collapse multiple hyphens", () => {
    const values = {
      name: "my--skill",
      description: "Test",
      content: "Content",
    };

    const result = buildSkillContent(values);

    expect(result).toContain("name: my-skill");
  });

  it("should handle empty content", () => {
    const values = {
      name: "my-skill",
      description: "Test",
    };

    const result = buildSkillContent(values);

    expect(result).toContain("---");
    expect(result).toContain("\n\n"); // Empty content after frontmatter
  });
});

describe("parseSkillContent", () => {
  it("should parse skill with frontmatter", () => {
    const content = `---
name: my-skill
description: A test skill
license: MIT
---
Skill content here`;

    const result = parseSkillContent(content);

    expect(result.frontmatter?.name).toBe("my-skill");
    expect(result.frontmatter?.description).toBe("A test skill");
    expect(result.frontmatter?.license).toBe("MIT");
    expect(result.body).toBe("Skill content here");
    expect(result.rawFrontmatter).toBeDefined();
  });

  it("should parse skill without frontmatter", () => {
    const content = "Just skill content";

    const result = parseSkillContent(content);

    expect(result.frontmatter).toBeUndefined();
    expect(result.body).toBe("Just skill content");
    expect(result.rawFrontmatter).toBeUndefined();
  });

  it("should handle quoted description values", () => {
    const content = `---
description: "A quoted description"
---
Content`;

    const result = parseSkillContent(content);

    expect(result.frontmatter?.description).toBe("A quoted description");
  });

  it("should handle single-quoted description values", () => {
    const content = `---
description: 'A single-quoted description'
---
Content`;

    const result = parseSkillContent(content);

    expect(result.frontmatter?.description).toBe("A single-quoted description");
  });

  it("should extract raw frontmatter", () => {
    const content = `---
name: test
description: Test
---
Body`;

    const result = parseSkillContent(content);

    expect(result.rawFrontmatter).toBe("name: test\ndescription: Test");
  });

  it("should handle multiline body content", () => {
    const content = `---
name: my-skill
description: Test
---
First line
Second line
Third line`;

    const result = parseSkillContent(content);

    expect(result.body).toContain("First line");
    expect(result.body).toContain("Second line");
    expect(result.body).toContain("Third line");
  });
});
