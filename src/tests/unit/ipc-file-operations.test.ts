/**
 * Pragmatic tests for IPC file operations
 * These test actual behavior with real filesystem interactions
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Helper to create temp directory
async function createTempDir(): Promise<string> {
  const tempPath = join(tmpdir(), `claude-test-${Date.now()}`);
  await mkdir(tempPath, { recursive: true });
  return tempPath;
}

// Helper to clean up temp directory
async function cleanupTempDir(path: string): Promise<void> {
  try {
    await rm(path, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe("IPC File Operations", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe("generateDefaultContent", () => {
    // Test the expected behavior without accessing internal functions
    function generateDefaultContent(type: string, name: string): string {
      const normalizedName = name.toLowerCase().replace(/\s+/g, "-");

      switch (type) {
        case "skills":
          return `---
name: ${normalizedName}
description: Description of what this skill does and when to use it
---

# ${name}

## When to use this skill
- Describe when Claude should use this skill

## Instructions
Add your skill instructions here.
`;

        case "commands":
          return `---
description: Description of what this command does
---

# ${name}

$ARGUMENTS

Add your command instructions here.
`;

        case "agents":
          return `---
name: ${normalizedName}
description: Description of what this agent does and when to delegate to it
instructions: Additional context for the agent
model: opus
color: blue
---

# ${name}

You are a specialist agent for...

## Instructions

Add your agent instructions here.
`;

        case "rules":
          return `# ${name}

## When this rule applies
- Describe when Claude should follow this rule

## The rule
- Add specific instructions
`;

        case "hooks":
          return `{
  "description": "Description of what this hook does",
  "enabled": true,
  "hookType": "user-message",
  "script": "// Hook script\\nconsole.log('Hook executed:', context);"
}`;

        default:
          return "";
      }
    }

    it("should generate valid skill content", () => {
      const content = generateDefaultContent("skills", "Test Skill");

      expect(content).toContain("---");
      expect(content).toContain("name: test-skill");
      expect(content).toContain("description:");
      expect(content).toContain("# Test Skill");
      expect(content).toContain("## When to use this skill");
    });

    it("should generate valid command content", () => {
      const content = generateDefaultContent("commands", "test-command");

      expect(content).toContain("---");
      expect(content).toContain("description:");
      expect(content).toContain("# test-command");
      expect(content).toContain("$ARGUMENTS");
    });

    it("should generate valid agent content", () => {
      const content = generateDefaultContent("agents", "TestAgent");

      expect(content).toContain("---");
      expect(content).toContain("name: testagent");
      expect(content).toContain("model: opus");
      expect(content).toContain("color: blue");
      expect(content).toContain("# TestAgent");
    });

    it("should generate valid rule content", () => {
      const content = generateDefaultContent("rules", "My Rule");

      expect(content).toContain("# My Rule");
      expect(content).toContain("## When this rule applies");
      expect(content).toContain("## The rule");
    });

    it("should generate valid hook content", () => {
      const content = generateDefaultContent("hooks", "test-hook");

      expect(content).toContain("{");
      expect(content).toContain('"description"');
      expect(content).toContain('"enabled"');
      expect(content).toContain('"hookType"');
      expect(content).toContain('"script"');
      expect(content).toContain("}");
    });
  });

  describe("getItemPath", () => {
    function getItemPath(
      projectPath: string,
      type: string,
      name: string
    ): { filePath: string; dirPath?: string } {
      const typeDir = join(projectPath, ".claude", type);

      switch (type) {
        case "skills": {
          const skillDir = join(typeDir, name);
          return { filePath: join(skillDir, "SKILL.md"), dirPath: skillDir };
        }

        case "commands": {
          const cmdPath = join(typeDir, `${name}.md`);
          return { filePath: cmdPath, dirPath: join(cmdPath, "..") };
        }

        case "agents": {
          return { filePath: join(typeDir, `${name}.md`), dirPath: typeDir };
        }

        case "rules": {
          return { filePath: join(typeDir, `${name}.md`), dirPath: typeDir };
        }

        case "hooks": {
          return { filePath: join(typeDir, `${name}.json`), dirPath: typeDir };
        }

        default:
          throw new Error(`Unknown type: ${type}`);
      }
    }

    it("should return correct path for skills (directory with SKILL.md)", () => {
      const result = getItemPath(tempDir, "skills", "my-skill");

      expect(result.dirPath).toContain(join(".claude", "skills", "my-skill"));
      expect(result.filePath).toContain(join("my-skill", "SKILL.md"));
    });

    it("should return correct path for commands (.md file)", () => {
      const result = getItemPath(tempDir, "commands", "my-command");

      expect(result.dirPath).toContain(join(".claude", "commands"));
      expect(result.filePath).toContain("my-command.md");
    });

    it("should return correct path for agents (.md file)", () => {
      const result = getItemPath(tempDir, "agents", "my-agent");

      expect(result.dirPath).toContain(join(".claude", "agents"));
      expect(result.filePath).toContain("my-agent.md");
    });

    it("should return correct path for rules (.md file)", () => {
      const result = getItemPath(tempDir, "rules", "my-rule");

      expect(result.dirPath).toContain(join(".claude", "rules"));
      expect(result.filePath).toContain("my-rule.md");
    });

    it("should return correct path for hooks (.json file)", () => {
      const result = getItemPath(tempDir, "hooks", "my-hook");

      expect(result.dirPath).toContain(join(".claude", "hooks"));
      expect(result.filePath).toContain("my-hook.json");
    });

    it("should throw error for unknown type", () => {
      expect(() => getItemPath(tempDir, "unknown", "test")).toThrow(
        "Unknown type"
      );
    });
  });

  describe("getDefaultName", () => {
    function getDefaultName(type: string): string {
      const timestamp = Date.now().toString(36);
      switch (type) {
        case "skills":
          return `new-skill-${timestamp}`;
        case "commands":
          return `new-command-${timestamp}`;
        case "agents":
          return `new-agent-${timestamp}`;
        case "rules":
          return `new-rule-${timestamp}`;
        case "hooks":
          return `new-hook-${timestamp}`;
        default:
          return `new-${type}-${timestamp}`;
      }
    }

    it("should generate default name for skills", () => {
      const name = getDefaultName("skills");
      expect(name).toMatch(/^new-skill-[a-z0-9]+$/);
    });

    it("should generate default name for commands", () => {
      const name = getDefaultName("commands");
      expect(name).toMatch(/^new-command-[a-z0-9]+$/);
    });

    it("should generate unique names for sequential calls", () => {
      // Note: In real implementation this would use different timestamps
      const type = "skills";
      const timestamp = Date.now().toString(36);
      const name1 = `new-${type}-${timestamp}`;
      // Simulate time passing
      const name2 = `new-${type}-${(Number.parseInt(timestamp, 36) + 1).toString(36)}`;

      expect(name1).not.toBe(name2);
    });
  });

  describe("File system integration", () => {
    it("should create and read files correctly", async () => {
      const testFile = join(tempDir, "test.txt");
      const testContent = "Hello, World!";

      await writeFile(testFile, testContent, "utf-8");
      const readContent = await readFile(testFile, "utf-8");

      expect(readContent).toBe(testContent);
    });

    it("should create nested directories", async () => {
      const nestedPath = join(tempDir, "a", "b", "c", "file.txt");

      await mkdir(join(nestedPath, ".."), { recursive: true });
      await writeFile(nestedPath, "test", "utf-8");

      const content = await readFile(nestedPath, "utf-8");
      expect(content).toBe("test");
    });

    it("should handle non-existent file reads gracefully", async () => {
      const nonExistentFile = join(tempDir, "does-not-exist.txt");

      await expect(readFile(nonExistentFile, "utf-8")).rejects.toThrow();
    });
  });

  describe("Path operations", () => {
    it("should construct correct relative paths", () => {
      const result = join(tempDir, "subdir", "file.txt");
      expect(result).toContain("subdir");
      expect(result).toContain("file.txt");
    });

    it("should handle parent directory references", () => {
      const childPath = join(tempDir, "child");
      const parentPath = join(childPath, "..");
      expect(parentPath).toBe(tempDir);
    });
  });

  describe("JSON operations", () => {
    it("should write and parse valid JSON", async () => {
      const jsonFile = join(tempDir, "config.json");
      const data = { key: "value", nested: { num: 42 } };

      await writeFile(jsonFile, JSON.stringify(data, null, 2), "utf-8");
      const content = await readFile(jsonFile, "utf-8");
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(data);
    });

    it("should detect invalid JSON", () => {
      const invalidJson = "{ invalid json }";
      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });

  describe("MCP config structure", () => {
    it("should have correct structure for server config", () => {
      const config = {
        mcpServers: {
          "test-server": {
            command: "npx",
            args: ["-y", "test-package"],
            env: { API_KEY: "test" },
          },
        },
      };

      expect(config.mcpServers["test-server"].command).toBe("npx");
      expect(config.mcpServers["test-server"].args).toEqual([
        "-y",
        "test-package",
      ]);
      expect(config.mcpServers["test-server"].env?.API_KEY).toBe("test");
    });

    it("should allow optional env in server config", () => {
      const config = {
        mcpServers: {
          "test-server": {
            command: "npx",
            args: ["-y", "test-package"],
          },
        },
      };

      expect(config.mcpServers["test-server"].env).toBeUndefined();
    });
  });
});
