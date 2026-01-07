/**
 * Pragmatic tests for IPC schemas
 * Tests actual schema validation and helper functions
 */
import { describe, expect, it } from "vitest";
import {
  agentFrontmatterSchema,
  buildFrontmatter,
  buildSkillContent,
  claudeMDSchema,
  commandSchema,
  hookSchema,
  hooksConfigSchema,
  hookTypeSchema,
  mcpConfigSchema,
  mcpServerSchema,
  mcpTransportTypeSchema,
  parseFrontmatter,
  ruleSchema,
  skillFrontmatterSchema,
  skillNameSchema,
  validateSkillContent,
} from "@/ipc/schemas";

describe("skillNameSchema", () => {
  it("should accept valid skill names", () => {
    const validNames = [
      "test",
      "my-skill",
      "skill-123",
      "a",
      "test-skill-name",
    ];

    validNames.forEach((name) => {
      const result = skillNameSchema.safeParse(name);
      expect(result.success).toBe(true);
    });
  });

  it("should reject names with uppercase letters", () => {
    const result = skillNameSchema.safeParse("MySkill");
    expect(result.success).toBe(false);
  });

  it("should reject names starting with hyphen", () => {
    const result = skillNameSchema.safeParse("-test");
    expect(result.success).toBe(false);
  });

  it("should reject names ending with hyphen", () => {
    const result = skillNameSchema.safeParse("test-");
    expect(result.success).toBe(false);
  });

  it("should reject names with consecutive hyphens", () => {
    const result = skillNameSchema.safeParse("test--skill");
    expect(result.success).toBe(false);
  });

  it("should reject empty strings", () => {
    const result = skillNameSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("should reject names over 64 characters", () => {
    const result = skillNameSchema.safeParse("a".repeat(65));
    expect(result.success).toBe(false);
  });

  it("should reject special characters", () => {
    const result = skillNameSchema.safeParse("test_skill");
    expect(result.success).toBe(false);
  });
});

describe("skillFrontmatterSchema", () => {
  it("should accept valid frontmatter", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
      description: "A test skill",
    });

    expect(result.success).toBe(true);
  });

  it("should accept frontmatter with optional fields", () => {
    const result = skillFrontmatterSchema.safeParse({
      name: "my-skill",
      description: "A test skill",
      license: "MIT",
      compatibility: "All models",
      metadata: { key: "value" },
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = skillFrontmatterSchema.safeParse({
      description: "Test",
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
});

describe("claudeMDSchema", () => {
  it("should accept valid CLAUDE.md content", () => {
    const result = claudeMDSchema.safeParse({
      content: "# Project instructions\n\nFollow these rules.",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = claudeMDSchema.safeParse({
      content: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("ruleSchema", () => {
  it("should accept valid rule", () => {
    const result = ruleSchema.safeParse({
      name: "my-rule",
      content: "Rule content here",
    });

    expect(result.success).toBe(true);
  });

  it("should accept rule with description", () => {
    const result = ruleSchema.safeParse({
      name: "my-rule",
      content: "Rule content",
      description: "A test rule",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = ruleSchema.safeParse({
      content: "Content",
    });

    expect(result.success).toBe(false);
  });

  it("should require content", () => {
    const result = ruleSchema.safeParse({
      name: "test",
    });

    expect(result.success).toBe(false);
  });
});

describe("agentFrontmatterSchema", () => {
  it("should accept valid agent", () => {
    const result = agentFrontmatterSchema.safeParse({
      name: "my-agent",
      description: "A test agent",
    });

    expect(result.success).toBe(true);
  });

  it("should accept agent with all optional fields", () => {
    const result = agentFrontmatterSchema.safeParse({
      name: "my-agent",
      description: "A test agent",
      instructions: "Follow these",
      tools: ["read", "write"],
      permissions: ["network"],
      model: "claude-3-5-sonnet-20241022",
      color: "blue",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = agentFrontmatterSchema.safeParse({
      description: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("should require description", () => {
    const result = agentFrontmatterSchema.safeParse({
      name: "test",
    });

    expect(result.success).toBe(false);
  });
});

describe("commandSchema", () => {
  it("should accept valid command", () => {
    const result = commandSchema.safeParse({
      name: "my-command",
      description: "A test command",
      content: "Command content",
    });

    expect(result.success).toBe(true);
  });

  it("should accept command with arguments", () => {
    const result = commandSchema.safeParse({
      name: "my-command",
      description: "A test command",
      arguments: "$ARGUMENTS",
      content: "Content",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = commandSchema.safeParse({
      description: "Test",
      content: "Content",
    });

    expect(result.success).toBe(false);
  });

  it("should require description", () => {
    const result = commandSchema.safeParse({
      name: "test",
      content: "Content",
    });

    expect(result.success).toBe(false);
  });

  it("should require content", () => {
    const result = commandSchema.safeParse({
      name: "test",
      description: "Test",
    });

    expect(result.success).toBe(false);
  });
});

describe("hookTypeSchema", () => {
  it("should accept all valid hook types", () => {
    const validTypes = [
      "PrePrompt",
      "PostPrompt",
      "PreToolUse",
      "PostToolUse",
      "PreResponse",
      "PostResponse",
    ];

    validTypes.forEach((type) => {
      const result = hookTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid hook types", () => {
    const result = hookTypeSchema.safeParse("InvalidType");
    expect(result.success).toBe(false);
  });
});

describe("hookSchema", () => {
  it("should accept valid hook", () => {
    const result = hookSchema.safeParse({
      name: "my-hook",
      type: "PrePrompt",
      handler: "console.log('test')",
    });

    expect(result.success).toBe(true);
  });

  it("should accept hook with all fields", () => {
    const result = hookSchema.safeParse({
      name: "my-hook",
      type: "PrePrompt",
      description: "A test hook",
      enabled: true,
      priority: 75,
      handler: "console.log('test')",
    });

    expect(result.success).toBe(true);
  });

  it("should use default enabled value", () => {
    const result = hookSchema.safeParse({
      name: "my-hook",
      type: "PrePrompt",
      handler: "console.log('test')",
    });

    if (result.success) {
      expect(result.data.enabled).toBe(true);
    }
  });

  it("should use default priority value", () => {
    const result = hookSchema.safeParse({
      name: "my-hook",
      type: "PrePrompt",
      handler: "console.log('test')",
    });

    if (result.success) {
      expect(result.data.priority).toBe(50);
    }
  });

  it("should reject priority outside 0-100 range", () => {
    const result = hookSchema.safeParse({
      name: "my-hook",
      type: "PrePrompt",
      handler: "test",
      priority: 150,
    });

    expect(result.success).toBe(false);
  });
});

describe("hooksConfigSchema", () => {
  it("should accept valid hooks config", () => {
    const result = hooksConfigSchema.safeParse({
      hooks: [
        {
          name: "hook1",
          type: "PrePrompt",
          handler: "console.log('1')",
        },
        {
          name: "hook2",
          type: "PostPrompt",
          handler: "console.log('2')",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty hooks array", () => {
    const result = hooksConfigSchema.safeParse({
      hooks: [],
    });

    expect(result.success).toBe(true);
  });
});

describe("mcpTransportTypeSchema", () => {
  it("should accept all transport types", () => {
    const types = ["stdio", "sse", "websocket"] as const;

    types.forEach((type) => {
      const result = mcpTransportTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid transport types", () => {
    const result = mcpTransportTypeSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("mcpServerSchema", () => {
  it("should accept server with command and args", () => {
    const result = mcpServerSchema.safeParse({
      name: "test-server",
      command: "npx",
      args: ["-y", "test-package"],
    });

    expect(result.success).toBe(true);
  });

  it("should accept server with URL", () => {
    const result = mcpServerSchema.safeParse({
      name: "test-server",
      url: "https://example.com",
    });

    expect(result.success).toBe(true);
  });

  it("should accept server with env", () => {
    const result = mcpServerSchema.safeParse({
      name: "test-server",
      command: "node",
      env: { API_KEY: "test" },
    });

    expect(result.success).toBe(true);
  });

  it("should use default enabled value", () => {
    const result = mcpServerSchema.safeParse({
      name: "test-server",
    });

    if (result.success) {
      expect(result.data.enabled).toBe(true);
    }
  });

  it("should reject invalid URL", () => {
    const result = mcpServerSchema.safeParse({
      name: "test-server",
      url: "not-a-url",
    });

    expect(result.success).toBe(false);
  });
});

describe("mcpConfigSchema", () => {
  it("should accept valid MCP config", () => {
    const result = mcpConfigSchema.safeParse({
      mcpServers: {
        "test-server": {
          name: "test-server",
          command: "npx",
          args: ["-y", "test"],
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("should accept multiple servers", () => {
    const result = mcpConfigSchema.safeParse({
      mcpServers: {
        server1: { name: "server1", command: "cmd1" },
        server2: { name: "server2", command: "cmd2" },
      },
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty mcpServers", () => {
    const result = mcpConfigSchema.safeParse({
      mcpServers: {},
    });

    expect(result.success).toBe(true);
  });
});

describe("parseFrontmatter", () => {
  it("should parse content with frontmatter", () => {
    const content = `---
name: my-skill
description: A test skill
---
Body content`;

    const result = parseFrontmatter(content, skillFrontmatterSchema);

    expect(result.frontmatter).toBeDefined();
    expect(result.body).toBe("Body content");
  });

  it("should return body only when no frontmatter", () => {
    const content = "Just body content";

    const result = parseFrontmatter(content, skillFrontmatterSchema);

    expect(result.frontmatter).toBeUndefined();
    expect(result.body).toBe("Just body content");
  });

  it("should handle invalid frontmatter gracefully", () => {
    const content = `---
invalid frontmatter
---
Body`;

    const result = parseFrontmatter(content, skillFrontmatterSchema);

    expect(result.frontmatter).toBeUndefined();
    expect(result.body).toBe(content);
  });
});

describe("buildFrontmatter", () => {
  it("should build frontmatter from object", () => {
    const data = {
      name: "test",
      description: "A test",
    };

    const result = buildFrontmatter(data);

    expect(result).toContain("---");
    expect(result).toContain("name: test");
    expect(result).toContain("description: A test");
  });

  it("should handle arrays", () => {
    const data = {
      tools: ["read", "write"],
    };

    const result = buildFrontmatter(data);

    expect(result).toContain("tools: [read, write]");
  });

  it("should skip undefined values", () => {
    const data = {
      name: "test",
      description: undefined,
    };

    const result = buildFrontmatter(data);

    expect(result).toContain("name: test");
    expect(result).not.toContain("description:");
  });

  it("should skip null values", () => {
    const data = {
      name: "test",
      description: null as unknown as string,
    };

    const result = buildFrontmatter(data);

    expect(result).toContain("name: test");
    expect(result).not.toContain("description:");
  });
});

describe("buildSkillContent", () => {
  it("should build skill with all fields", () => {
    const result = buildSkillContent(
      "MySkill",
      "A test skill",
      "MIT",
      "All models",
      "Skill content here"
    );

    expect(result).toContain("---");
    expect(result).toContain("name: myskill");
    expect(result).toContain("description: A test skill");
    expect(result).toContain("license: MIT");
    expect(result).toContain("compatibility: All models");
    expect(result).toContain("Skill content here");
  });

  it("should normalize skill name", () => {
    const result = buildSkillContent(
      "My@Skill#Test",
      "Description",
      undefined,
      undefined,
      "Content"
    );

    expect(result).toContain("name: my-skill-test");
  });

  it("should build skill without optional fields", () => {
    const result = buildSkillContent(
      "my-skill",
      "Description",
      undefined,
      undefined,
      "Content"
    );

    expect(result).toContain("name: my-skill");
    expect(result).toContain("description: Description");
    expect(result).not.toContain("license:");
    expect(result).not.toContain("compatibility:");
  });
});

describe("validateSkillContent", () => {
  it("should validate correct skill content", () => {
    const content = `---
name: my-skill
description: A test skill
---
Content here`;

    const result = validateSkillContent(content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.frontmatter).toBeDefined();
    expect(result.body).toBe("Content here");
  });

  it("should return errors for invalid content", () => {
    const content = `---
name: Invalid_Skill
description: Test
---
Content`;

    const result = validateSkillContent(content);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should return errors for missing frontmatter", () => {
    const content = "Just content";

    const result = validateSkillContent(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing or invalid frontmatter");
  });
});
