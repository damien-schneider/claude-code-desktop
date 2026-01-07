/**
 * Pragmatic tests for hook schema
 * Tests actual schema validation and helper functions
 */
import { describe, expect, it } from "vitest";
import {
  buildHookJson,
  hookCreateSchema,
  hookFormSchema,
  hookJsonSchema,
  hookJsonSchemaValidated,
  hookTypeSchema,
  parseHookJson,
  validateHookScript,
} from "@/schemas/claude/hook.schema";

describe("hookTypeSchema", () => {
  it("should accept all valid hook types", () => {
    const validTypes = [
      "SessionStart",
      "PromptSubmit",
      "ToolUse",
      "ToolOutput",
      "Response",
      "SessionEnd",
    ];

    for (const type of validTypes) {
      const result = hookTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid hook types", () => {
    const result = hookTypeSchema.safeParse("InvalidType");
    expect(result.success).toBe(false);
  });
});

describe("hookJsonSchema", () => {
  it("should accept valid hook with script", () => {
    const result = hookJsonSchema.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
      script: "console.log('test')",
    });

    expect(result.success).toBe(true);
  });

  it("should accept valid hook with lifecycle methods", () => {
    const result = hookJsonSchema.safeParse({
      name: "my-hook",
      hookType: "PromptSubmit",
      onSubmit: "console.log('submit')",
    });

    expect(result.success).toBe(true);
  });

  it("should accept hook with all optional fields", () => {
    const result = hookJsonSchema.safeParse({
      name: "my-hook",
      description: "A test hook",
      hookType: "ToolUse",
      enabled: true,
      script: "console.log('test')",
      onStart: "console.log('start')",
      onSubmit: "console.log('submit')",
      onToolUse: "console.log('tool')",
      onToolOutput: "console.log('output')",
      onResponse: "console.log('response')",
      onEnd: "console.log('end')",
    });

    expect(result.success).toBe(true);
  });

  it("should use default enabled value", () => {
    const result = hookJsonSchema.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
    });

    if (result.success) {
      expect(result.data.enabled).toBe(true);
    }
  });

  it("should require name", () => {
    const result = hookJsonSchema.safeParse({
      hookType: "SessionStart",
    });

    expect(result.success).toBe(false);
  });

  it("should require hookType", () => {
    const result = hookJsonSchema.safeParse({
      name: "my-hook",
    });

    expect(result.success).toBe(false);
  });

  it("should validate name with claudeNameSchema", () => {
    const result = hookJsonSchema.safeParse({
      name: "Invalid_Hook",
      hookType: "SessionStart",
    });

    expect(result.success).toBe(false);
  });

  it("should reject description over 500 characters", () => {
    const result = hookJsonSchema.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
      description: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });
});

describe("hookJsonSchemaValidated", () => {
  it("should accept hook with script", () => {
    const result = hookJsonSchemaValidated.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
      script: "console.log('test')",
    });

    expect(result.success).toBe(true);
  });

  it("should accept hook with lifecycle methods", () => {
    const result = hookJsonSchemaValidated.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
      onStart: "console.log('start')",
    });

    expect(result.success).toBe(true);
  });

  it("should reject hook without script or lifecycle methods", () => {
    const result = hookJsonSchemaValidated.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        "must have a script or at least one lifecycle method"
      );
    }
  });
});

describe("hookFormSchema", () => {
  it("should accept valid form data", () => {
    const result = hookFormSchema.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
      description: "A test hook",
      enabled: true,
      script: "console.log('test')",
    });

    expect(result.success).toBe(true);
  });

  it("should accept form with only required fields", () => {
    const result = hookFormSchema.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = hookFormSchema.safeParse({
      hookType: "SessionStart",
    });

    expect(result.success).toBe(false);
  });

  it("should require hookType", () => {
    const result = hookFormSchema.safeParse({
      name: "my-hook",
    });

    expect(result.success).toBe(false);
  });
});

describe("hookCreateSchema", () => {
  it("should accept valid name and type", () => {
    const result = hookCreateSchema.safeParse({
      name: "my-hook",
      hookType: "SessionStart",
    });

    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = hookCreateSchema.safeParse({
      hookType: "SessionStart",
    });

    expect(result.success).toBe(false);
  });

  it("should require hookType", () => {
    const result = hookCreateSchema.safeParse({
      name: "my-hook",
    });

    expect(result.success).toBe(false);
  });
});

describe("buildHookJson", () => {
  it("should build hook JSON with description", () => {
    const result = buildHookJson({
      name: "my-hook",
      hookType: "SessionStart",
      description: "A test hook",
    });

    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("my-hook");
    expect(parsed.description).toBe("A test hook");
    expect(parsed.hookType).toBe("SessionStart");
    expect(parsed.enabled).toBe(true);
    expect(parsed.script).toContain("// SessionStart hook script");
  });

  it("should build hook JSON with default description", () => {
    const result = buildHookJson({
      name: "my-hook",
      hookType: "PromptSubmit",
    });

    const parsed = JSON.parse(result);
    expect(parsed.description).toBe("My PromptSubmit hook");
  });

  it("should include script content", () => {
    const result = buildHookJson({
      name: "my-hook",
      hookType: "ToolUse",
    });

    const parsed = JSON.parse(result);
    expect(parsed.script).toContain("// ToolUse hook script");
    expect(parsed.script).toContain("console.log('ToolUse hook executed:'");
  });

  it("should produce valid JSON", () => {
    const result = buildHookJson({
      name: "my-hook",
      hookType: "Response",
    });

    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("should format JSON with indentation", () => {
    const result = buildHookJson({
      name: "my-hook",
      hookType: "SessionEnd",
    });

    expect(result).toContain("{\n  ");
  });
});

describe("parseHookJson", () => {
  it("should parse valid hook JSON", () => {
    const json = JSON.stringify({
      name: "my-hook",
      hookType: "SessionStart",
      script: "console.log('test')",
    });

    const result = parseHookJson(json);

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("my-hook");
    expect(result.data?.hookType).toBe("SessionStart");
    expect(result.error).toBeUndefined();
  });

  it("should reject invalid JSON", () => {
    const result = parseHookJson("invalid json");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject hook without script or lifecycle methods", () => {
    const json = JSON.stringify({
      name: "my-hook",
      hookType: "SessionStart",
    });

    const result = parseHookJson(json);

    expect(result.success).toBe(false);
    expect(result.error).toContain("must have a script");
  });

  it("should reject hook with invalid name", () => {
    const json = JSON.stringify({
      name: "Invalid_Hook",
      hookType: "SessionStart",
      script: "console.log('test')",
    });

    const result = parseHookJson(json);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject hook with invalid hookType", () => {
    const json = JSON.stringify({
      name: "my-hook",
      hookType: "InvalidType",
      script: "console.log('test')",
    });

    const result = parseHookJson(json);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should accept hook with lifecycle method", () => {
    const json = JSON.stringify({
      name: "my-hook",
      hookType: "SessionStart",
      onStart: "console.log('start')",
    });

    const result = parseHookJson(json);

    expect(result.success).toBe(true);
  });
});

describe("validateHookScript", () => {
  it("should validate valid JavaScript", () => {
    const result = validateHookScript("console.log('test');");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should validate multi-line script", () => {
    const script = `
      const x = 1;
      const y = 2;
      console.log(x + y);
    `;

    const result = validateHookScript(script);
    expect(result.valid).toBe(true);
  });

  it("should validate async function", () => {
    const script = "async function test() { await Promise.resolve(); }";
    const result = validateHookScript(script);
    expect(result.valid).toBe(true);
  });

  it("should reject invalid JavaScript syntax", () => {
    const result = validateHookScript("console.log('test'");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject syntax with unclosed brackets", () => {
    const result = validateHookScript("{ console.log('test'); ");
    expect(result.valid).toBe(false);
  });

  it("should validate arrow function", () => {
    const script = "() => { console.log('test'); }";
    const result = validateHookScript(script);
    expect(result.valid).toBe(true);
  });
});
