/**
 * Pragmatic tests for agent schema
 * Tests actual schema validation and helper functions
 */
import { describe, expect, it } from "vitest";
import {
  agentContentSchema,
  agentCreateSchema,
  agentFormSchema,
  agentFrontmatterSchema,
  buildAgentContent,
  parseAgentContent,
} from "@/schemas/claude/agent.schema";

describe("agentFrontmatterSchema", () => {
  it("should accept valid agent with all fields", () => {
    const result = agentFrontmatterSchema.safeParse({
      name: "my-agent",
      description: "A test agent",
      instructions: "Follow these",
      tools: "read,write",
      permissions: "network",
      model: "claude-3-5-sonnet-20241022",
      color: "blue",
    });

    expect(result.success).toBe(true);
  });

  it("should accept agent with only required fields", () => {
    const result = agentFrontmatterSchema.safeParse({
      name: "my-agent",
      description: "A test agent",
      tools: "",
      permissions: "",
      model: "claude-3-5-sonnet-20241022",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = agentFrontmatterSchema.safeParse({
      description: "Test",
      tools: "",
      permissions: "",
      model: "claude-3-5-sonnet-20241022",
    });

    expect(result.success).toBe(false);
  });

  it("should require description", () => {
    const result = agentFrontmatterSchema.safeParse({
      name: "my-agent",
      tools: "",
      permissions: "",
      model: "claude-3-5-sonnet-20241022",
    });

    expect(result.success).toBe(false);
  });

  it("should reject description over 500 characters", () => {
    const result = agentFrontmatterSchema.safeParse({
      name: "my-agent",
      description: "a".repeat(501),
      tools: "",
      permissions: "",
      model: "claude-3-5-sonnet-20241022",
    });

    expect(result.success).toBe(false);
  });

  it("should reject invalid model", () => {
    const result = agentFrontmatterSchema.safeParse({
      name: "my-agent",
      description: "Test",
      tools: "",
      permissions: "",
      model: "invalid-model",
    });

    expect(result.success).toBe(false);
  });
});

describe("agentContentSchema", () => {
  it("should accept content with frontmatter and body", () => {
    const result = agentContentSchema.safeParse({
      frontmatter: {
        name: "my-agent",
        description: "Test",
        tools: "",
        permissions: "",
        model: "claude-3-5-sonnet-20241022",
      },
      body: "Agent instructions here",
    });

    expect(result.success).toBe(true);
  });

  it("should accept content with only frontmatter", () => {
    const result = agentContentSchema.safeParse({
      frontmatter: {
        name: "my-agent",
        description: "Test",
        tools: "",
        permissions: "",
        model: "claude-3-5-sonnet-20241022",
      },
    });

    expect(result.success).toBe(true);
  });

  it("should require frontmatter", () => {
    const result = agentContentSchema.safeParse({
      body: "Content",
    });

    expect(result.success).toBe(false);
  });
});

describe("agentFormSchema", () => {
  it("should accept valid form data", () => {
    const result = agentFormSchema.safeParse({
      name: "my-agent",
      description: "A test agent",
      instructions: "Follow these",
      tools: "read,write",
      permissions: "network",
      model: "claude-3-5-sonnet-20241022",
      color: "blue",
      content: "Agent content",
    });

    expect(result.success).toBe(true);
  });

  it("should accept form with only required fields", () => {
    const result = agentFormSchema.safeParse({
      name: "my-agent",
      description: "A test agent",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = agentFormSchema.safeParse({
      description: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("should require description", () => {
    const result = agentFormSchema.safeParse({
      name: "my-agent",
    });

    expect(result.success).toBe(false);
  });
});

describe("agentCreateSchema", () => {
  it("should accept valid name", () => {
    const result = agentCreateSchema.safeParse({
      name: "my-agent",
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = agentCreateSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("should validate name with claudeNameSchema", () => {
    const result = agentCreateSchema.safeParse({
      name: "Invalid_Agent",
    });

    expect(result.success).toBe(false);
  });
});

describe("buildAgentContent", () => {
  it("should build agent with all fields", () => {
    const values = {
      name: "my-agent",
      description: "A test agent",
      instructions: "Follow these rules",
      tools: "read,write",
      permissions: "network",
      model: "claude-3-5-sonnet-20241022",
      color: "blue",
      content: "Specific instructions here",
    };

    const result = buildAgentContent(values);

    expect(result).toContain("---");
    expect(result).toContain("name: my-agent");
    expect(result).toContain("description: A test agent");
    expect(result).toContain("instructions: Follow these rules");
    expect(result).toContain("tools:");
    expect(result).toContain("- read");
    expect(result).toContain("- write");
    expect(result).toContain("permissions:");
    expect(result).toContain("- network");
    expect(result).toContain("model: claude-3-5-sonnet-20241022");
    expect(result).toContain("color: blue");
    expect(result).toContain("# my-agent");
    expect(result).toContain("Specific instructions here");
  });

  it("should build agent with only required fields", () => {
    const values = {
      name: "my-agent",
      description: "A test agent",
    };

    const result = buildAgentContent(values);

    expect(result).toContain("name: my-agent");
    expect(result).toContain("description: A test agent");
    expect(result).toContain("# my-agent");
    expect(result).toContain("You are a specialist agent");
  });

  it("should parse comma-separated tools", () => {
    const values = {
      name: "my-agent",
      description: "Test",
      tools: "read, write, execute",
    };

    const result = buildAgentContent(values);

    expect(result).toContain("tools:");
    expect(result).toContain("- read");
    expect(result).toContain("- write");
    expect(result).toContain("- execute");
  });

  it("should trim tool names", () => {
    const values = {
      name: "my-agent",
      description: "Test",
      tools: " read , write , execute ",
    };

    const result = buildAgentContent(values);

    expect(result).toContain("- read");
    expect(result).toContain("- write");
  });

  it("should filter empty tool names", () => {
    const values = {
      name: "my-agent",
      description: "Test",
      tools: "read,,write",
    };

    const result = buildAgentContent(values);

    expect(result).toContain("- read");
    expect(result).toContain("- write");
  });

  it("should handle empty content", () => {
    const values = {
      name: "my-agent",
      description: "Test",
      content: "",
    };

    const result = buildAgentContent(values);

    expect(result).toContain("# my-agent");
    expect(result).toContain("## Instructions");
  });
});

describe("parseAgentContent", () => {
  it("should parse agent with frontmatter", () => {
    const content = `---
name: my-agent
description: A test agent
instructions: Follow these
model: claude-3-5-sonnet-20241022
---
Agent body content`;

    const result = parseAgentContent(content);

    expect(result.frontmatter?.name).toBe("my-agent");
    expect(result.frontmatter?.description).toBe("A test agent");
    expect(result.frontmatter?.instructions).toBe("Follow these");
    expect(result.frontmatter?.model).toBe("claude-3-5-sonnet-20241022");
    expect(result.body).toBe("Agent body content");
    expect(result.rawFrontmatter).toBeDefined();
  });

  it("should parse agent with arrays", () => {
    const content = `---
name: my-agent
description: Test
tools: read, write
permissions: network
---
Body`;

    const result = parseAgentContent(content);

    // Parser stores comma-separated strings as-is (stringArraySchema handles the transform later)
    expect(result.frontmatter?.tools).toBe("read, write");
    expect(result.frontmatter?.permissions).toBe("network");
  });

  it("should parse agent without frontmatter", () => {
    const content = "Just agent content";

    const result = parseAgentContent(content);

    expect(result.frontmatter).toBeUndefined();
    expect(result.body).toBe("Just agent content");
    expect(result.rawFrontmatter).toBeUndefined();
  });

  it("should extract raw frontmatter", () => {
    const content = `---
name: test
description: Test description
---
Body`;

    const result = parseAgentContent(content);

    expect(result.rawFrontmatter).toBe(
      "name: test\ndescription: Test description"
    );
  });

  it("should handle quoted values", () => {
    const content = `---
description: "A quoted description"
---
Body`;

    const result = parseAgentContent(content);

    expect(result.frontmatter?.description).toBe("A quoted description");
  });

  it("should handle single-quoted values", () => {
    const content = `---
description: 'A single-quoted description'
---
Body`;

    const result = parseAgentContent(content);

    expect(result.frontmatter?.description).toBe("A single-quoted description");
  });
});
