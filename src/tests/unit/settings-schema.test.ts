/**
 * Pragmatic tests for settings schema
 * Tests actual schema validation and helper functions
 */
import { describe, expect, it } from "vitest";
import {
  buildDefaultSettings,
  envVarKeySchema,
  envVarValueSchema,
  formatAllowedTools,
  formatModelPreferences,
  type McpServerConfig,
  mcpServerEnvSchema,
  mcpServerSchema,
  mcpServersSchema,
  mcpServerTypeSchema,
  modelIdentifierSchema,
  parseAllowedTools,
  parseModelPreferences,
  parseSettingsJson,
  type SettingsFormValues,
  type SettingsJson,
  settingsFormSchema,
  settingsJsonSchema,
  type Theme,
  themeSchema,
  toolPermissionSchema,
} from "@/schemas/claude/settings.schema";

// Top-level regex patterns for performance
const JSON_PARSE_ERROR_REGEX = /JSON|parse|position/i;

describe("toolPermissionSchema", () => {
  const validPermissions = [
    "Edit",
    "Read",
    "Bash",
    "WebSearch",
    "Bash(git:*)",
    "Read(*)",
    "Edit(file:*)",
    "Bash(git-commit:*)",
    "Bash(npm:dev)",
    "Bash(git:commit)",
    "mcp__tool-name",
    "mcp__server__tool",
  ];

  const invalidPermissions = [
    "",
    "Tool with spaces",
    "Tool@WithSpecial",
    "tool.with.dots",
  ];

  describe("valid permissions", () => {
    it.each(validPermissions)("should accept: %s", (permission) => {
      const result = toolPermissionSchema.safeParse(permission);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(permission);
      }
    });
  });

  describe("invalid permissions", () => {
    it.each(invalidPermissions)("should reject: %s", (permission) => {
      const result = toolPermissionSchema.safeParse(permission);
      expect(result.success).toBe(false);
    });
  });

  it("should reject empty string", () => {
    const result = toolPermissionSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("cannot be empty");
    }
  });
});

describe("modelIdentifierSchema", () => {
  it("should accept valid model identifiers", () => {
    const validModels = [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "sonnet",
      "haiku",
      "opus",
      "gpt-4",
      "gpt-3.5-turbo",
      "a".repeat(200),
    ];

    for (const model of validModels) {
      const result = modelIdentifierSchema.safeParse(model);
      expect(result.success).toBe(true);
    }
  });

  it("should reject empty string", () => {
    const result = modelIdentifierSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("cannot be empty");
    }
  });

  it("should reject strings over 200 characters", () => {
    const result = modelIdentifierSchema.safeParse("a".repeat(201));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("too long");
    }
  });
});

describe("envVarKeySchema", () => {
  const validKeys = [
    "API_KEY",
    "API_KEY_123",
    "A",
    "API_KEY_V2",
    "DATABASE_URL",
    "PORT",
  ];

  const invalidKeys = [
    "api_key",
    "API-KEY",
    "API KEY",
    "123_API_KEY",
    "",
    "API.KEY",
  ];

  describe("valid keys", () => {
    it.each(validKeys)("should accept: %s", (key) => {
      const result = envVarKeySchema.safeParse(key);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid keys", () => {
    it.each(invalidKeys)("should reject: %s", (key) => {
      const result = envVarKeySchema.safeParse(key);
      expect(result.success).toBe(false);
    });
  });

  it("should reject empty string", () => {
    const result = envVarKeySchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("cannot be empty");
    }
  });
});

describe("envVarValueSchema", () => {
  it("should accept any string value", () => {
    const values = [
      "my-api-key-123",
      "https://example.com",
      "value with spaces",
      "",
      "special!@#$%^&*()",
    ];

    for (const value of values) {
      const result = envVarValueSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });
});

describe("themeSchema", () => {
  it("should accept all valid theme values", () => {
    const themes = ["light", "dark", "system"] as const;

    for (const theme of themes) {
      const result = themeSchema.safeParse(theme);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid theme values", () => {
    const result = themeSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("mcpServerTypeSchema", () => {
  it("should accept all valid MCP server types", () => {
    const types = ["stdio", "sse"] as const;

    for (const type of types) {
      const result = mcpServerTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid server types", () => {
    const result = mcpServerTypeSchema.safeParse("websocket");
    expect(result.success).toBe(false);
  });
});

describe("mcpServerEnvSchema", () => {
  it("should accept valid environment variables object", () => {
    const result = mcpServerEnvSchema.safeParse({
      API_KEY: "secret123",
      DATABASE_URL: "postgres://localhost",
      PORT: "5432",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid env var keys", () => {
    const result = mcpServerEnvSchema.safeParse({
      api_key: "secret",
      INVALID_KEY: "value",
    });

    expect(result.success).toBe(false);
  });

  it("should accept empty object", () => {
    const result = mcpServerEnvSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should handle undefined", () => {
    const result = mcpServerEnvSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });
});

describe("mcpServerSchema", () => {
  it("should accept server with command and args", () => {
    const result = mcpServerSchema.safeParse({
      type: "stdio",
      command: "npx",
      args: ["-y", "test-package"],
    });

    expect(result.success).toBe(true);
  });

  it("should accept server with URL", () => {
    const result = mcpServerSchema.safeParse({
      type: "sse",
      url: "https://example.com/sse",
    });

    expect(result.success).toBe(true);
  });

  it("should accept server with env", () => {
    const result = mcpServerSchema.safeParse({
      type: "stdio",
      command: "node",
      env: {
        API_KEY: "test",
        DATABASE_URL: "postgres://localhost",
      },
    });

    expect(result.success).toBe(true);
  });

  it("should accept server with only required fields", () => {
    const result = mcpServerSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject invalid URL", () => {
    const result = mcpServerSchema.safeParse({
      url: "not-a-url",
    });

    expect(result.success).toBe(false);
  });

  it("should reject invalid env keys", () => {
    const result = mcpServerSchema.safeParse({
      env: {
        invalid_key: "value",
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("mcpServersSchema", () => {
  it("should accept multiple servers", () => {
    const result = mcpServersSchema.safeParse({
      "server-1": {
        type: "stdio",
        command: "npx",
        args: ["-y", "package1"],
      },
      "server-2": {
        type: "sse",
        url: "https://example.com/sse",
      },
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = mcpServersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject server with empty name", () => {
    const result = mcpServersSchema.safeParse({
      "": {
        command: "test",
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("settingsJsonSchema", () => {
  it("should accept valid settings with all fields", () => {
    const result = settingsJsonSchema.safeParse({
      allowedTools: ["Edit", "Read", "Bash(git:*)"],
      modelPreferences: {
        anthropic: "claude-3-5-sonnet-20241022",
        openai: "gpt-4",
      },
      theme: "dark",
      environmentVariables: {
        API_KEY: "secret123",
        DATABASE_URL: "postgres://localhost",
      },
      humanInstructions: "Follow these guidelines",
      customPrompt: "Custom prompt template",
    });

    expect(result.success).toBe(true);
  });

  it("should accept settings with only some fields", () => {
    const result = settingsJsonSchema.safeParse({
      theme: "light",
      allowedTools: ["Edit"],
    });

    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = settingsJsonSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject invalid tool permissions", () => {
    const result = settingsJsonSchema.safeParse({
      allowedTools: ["", "Edit"],
    });

    expect(result.success).toBe(false);
  });

  it("should reject invalid env var keys", () => {
    const result = settingsJsonSchema.safeParse({
      environmentVariables: {
        invalid_key: "value",
      },
    });

    expect(result.success).toBe(false);
  });

  it("should reject humanInstructions over 5000 characters", () => {
    const result = settingsJsonSchema.safeParse({
      humanInstructions: "a".repeat(5001),
    });

    expect(result.success).toBe(false);
  });

  it("should reject customPrompt over 10000 characters", () => {
    const result = settingsJsonSchema.safeParse({
      customPrompt: "a".repeat(10_001),
    });

    expect(result.success).toBe(false);
  });
});

describe("settingsFormSchema", () => {
  it("should accept valid form data", () => {
    const result = settingsFormSchema.safeParse({
      allowedTools: "Edit\nRead\nBash(git:*)",
      modelPreferences: "anthropic=claude-3-5-sonnet-20241022",
      theme: "dark",
    });

    expect(result.success).toBe(true);
  });

  it("should accept form with no fields", () => {
    const result = settingsFormSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept undefined for all fields", () => {
    const result = settingsFormSchema.safeParse({
      allowedTools: undefined,
      modelPreferences: undefined,
      theme: undefined,
    });

    expect(result.success).toBe(true);
  });
});

describe("parseSettingsJson", () => {
  it("should parse valid settings JSON", () => {
    const json = JSON.stringify({
      allowedTools: ["Edit", "Read"],
      theme: "dark",
    });

    const result = parseSettingsJson(json);

    expect(result.success).toBe(true);
    expect(result.data?.allowedTools).toEqual(["Edit", "Read"]);
    expect(result.data?.theme).toBe("dark");
    expect(result.error).toBeUndefined();
  });

  it("should reject invalid JSON", () => {
    const result = parseSettingsJson("not json");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject invalid settings data", () => {
    const json = JSON.stringify({
      allowedTools: ["invalid tool", "Edit"],
    });

    const result = parseSettingsJson(json);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should handle JSON parse errors", () => {
    const result = parseSettingsJson("{invalid json}");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(JSON_PARSE_ERROR_REGEX);
  });
});

describe("buildDefaultSettings", () => {
  it("should build valid default settings", () => {
    const result = buildDefaultSettings();

    const parsed = JSON.parse(result);
    expect(parsed.allowedTools).toEqual([]);
    expect(parsed.modelPreferences).toEqual({});
    expect(parsed.theme).toBe("system");
  });

  it("should produce valid JSON", () => {
    const result = buildDefaultSettings();
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("should format with 2-space indentation", () => {
    const result = buildDefaultSettings();
    expect(result).toContain("{\n  ");
  });
});

describe("formatAllowedTools", () => {
  it("should format tools array as string", () => {
    const result = formatAllowedTools(["Edit", "Read", "Bash(git:*)"]);
    expect(result).toBe("Edit\nRead\nBash(git:*)");
  });

  it("should return empty string for empty array", () => {
    const result = formatAllowedTools([]);
    expect(result).toBe("");
  });

  it("should handle single tool", () => {
    const result = formatAllowedTools(["Edit"]);
    expect(result).toBe("Edit");
  });
});

describe("parseAllowedTools", () => {
  it("should parse newline-separated tools", () => {
    const result = parseAllowedTools("Edit\nRead\nBash(git:*)");
    expect(result).toEqual(["Edit", "Read", "Bash(git:*)"]);
  });

  it("should trim whitespace from tool names", () => {
    const result = parseAllowedTools(" Edit \n Read \n Bash ");
    expect(result).toEqual(["Edit", "Read", "Bash"]);
  });

  it("should filter empty lines", () => {
    const result = parseAllowedTools("Edit\n\nRead\n\n\nBash");
    expect(result).toEqual(["Edit", "Read", "Bash"]);
  });

  it("should handle empty string", () => {
    const result = parseAllowedTools("");
    expect(result).toEqual([]);
  });

  it("should handle whitespace-only string", () => {
    const result = parseAllowedTools("  \n  \n  ");
    expect(result).toEqual([]);
  });
});

describe("formatModelPreferences", () => {
  it("should format preferences as key=value lines", () => {
    const result = formatModelPreferences({
      anthropic: "claude-3-5-sonnet-20241022",
      openai: "gpt-4",
    });
    expect(result).toBe("anthropic=claude-3-5-sonnet-20241022\nopenai=gpt-4");
  });

  it("should return empty string for empty object", () => {
    const result = formatModelPreferences({});
    expect(result).toBe("");
  });

  it("should handle single preference", () => {
    const result = formatModelPreferences({
      anthropic: "claude-3-5-sonnet-20241022",
    });
    expect(result).toBe("anthropic=claude-3-5-sonnet-20241022");
  });
});

describe("parseModelPreferences", () => {
  it("should parse key=value lines", () => {
    const result = parseModelPreferences(
      "anthropic=claude-3-5-sonnet-20241022\nopenai=gpt-4"
    );
    expect(result).toEqual({
      anthropic: "claude-3-5-sonnet-20241022",
      openai: "gpt-4",
    });
  });

  it("should handle values with =", () => {
    const result = parseModelPreferences("model=gpt-4=turbo");
    expect(result).toEqual({
      model: "gpt-4=turbo",
    });
  });

  it("should trim whitespace", () => {
    const result = parseModelPreferences(
      " anthropic = claude-3-5-sonnet-20241022 "
    );
    expect(result).toEqual({
      anthropic: "claude-3-5-sonnet-20241022",
    });
  });

  it("should filter empty lines and invalid entries", () => {
    const result = parseModelPreferences(
      "anthropic=claude-3-5-sonnet-20241022\n\ninvalid\nopenai=gpt-4"
    );
    expect(result).toEqual({
      anthropic: "claude-3-5-sonnet-20241022",
      openai: "gpt-4",
    });
  });

  it("should handle empty string", () => {
    const result = parseModelPreferences("");
    expect(result).toEqual({});
  });

  it("should handle entries without values", () => {
    const result = parseModelPreferences("anthropic=\nopenai=gpt-4");
    expect(result).toEqual({
      openai: "gpt-4",
    });
  });
});

describe("Type exports", () => {
  it("should export SettingsJson type", () => {
    const settings: SettingsJson = {
      allowedTools: ["Edit", "Read"],
      theme: "dark",
    };
    expect(settings.allowedTools).toBeDefined();
  });

  it("should export SettingsFormValues type", () => {
    const form: SettingsFormValues = {
      allowedTools: "Edit\nRead",
      theme: "light",
    };
    expect(form.allowedTools).toBeDefined();
  });

  it("should export McpServerConfig type", () => {
    const server: McpServerConfig = {
      type: "stdio",
      command: "npx",
      args: ["-y", "test"],
    };
    expect(server.type).toBe("stdio");
  });

  it("should export Theme type", () => {
    const theme: Theme = "dark";
    expect(theme).toBe("dark");
  });
});
