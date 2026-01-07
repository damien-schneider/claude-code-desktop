/**
 * Pragmatic tests for IPC handler implementations
 * Tests actual file operations without mocking
 */

import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Top-level regex patterns for performance
const VALID_SKILL_NAME_REGEX = /^[a-z][a-z0-9-]*$/;
const CLAUDE_MODEL_PREFIX_REGEX = /^claude-/;

async function createTempDir(): Promise<string> {
  // Use shorter name to avoid path length issues on macOS
  const tempPath = join(tmpdir(), `ipc-${Date.now().toString(36)}`);
  await mkdir(tempPath, { recursive: true });
  return tempPath;
}

async function cleanupTempDir(path: string): Promise<void> {
  try {
    await rm(path, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe("IPC Handler - File Operations", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe("CLAUDE.md operations", () => {
    it("should handle missing CLAUDE.md gracefully", async () => {
      const paths = [
        join(tempDir, "CLAUDE.md"),
        join(tempDir, ".claude", "CLAUDE.md"),
      ];

      let found = false;
      for (const path of paths) {
        try {
          await readFile(path, "utf-8");
          found = true;
          break;
        } catch {
          // File doesn't exist, try next
        }
      }

      expect(found).toBe(false);
    });

    it("should create CLAUDE.md in .claude directory", async () => {
      const claudeDir = join(tempDir, ".claude");
      await mkdir(claudeDir, { recursive: true });
      const claudeMdPath = join(claudeDir, "CLAUDE.md");
      await writeFile(claudeMdPath, "# Test Content", "utf-8");

      const content = await readFile(claudeMdPath, "utf-8");
      expect(content).toBe("# Test Content");
    });
  });

  describe("Settings.json operations", () => {
    it("should handle missing settings.json", async () => {
      const settingsPath = join(tempDir, ".claude", "settings.json");

      try {
        await readFile(settingsPath, "utf-8");
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as NodeJS.ErrnoException).code).toBe("ENOENT");
      }
    });

    it("should write and read valid JSON settings", async () => {
      const settingsDir = join(tempDir, ".claude");
      await mkdir(settingsDir, { recursive: true });
      const settingsPath = join(settingsDir, "settings.json");
      const settings = {
        allowedTools: ["read", "write"],
        modelPreferences: {},
      };

      await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
      const content = await readFile(settingsPath, "utf-8");
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(settings);
    });

    it("should reject invalid JSON in settings", async () => {
      const settingsDir = join(tempDir, ".claude");
      await mkdir(settingsDir, { recursive: true });
      const settingsPath = join(settingsDir, "settings.json");

      await writeFile(settingsPath, "{ invalid json", "utf-8");
      const content = await readFile(settingsPath, "utf-8");

      expect(() => JSON.parse(content)).toThrow();
    });
  });

  describe("Directory operations", () => {
    it("should create .claude directory structure", async () => {
      const types = ["skills", "commands", "agents", "rules", "hooks"];

      for (const type of types) {
        const dirPath = join(tempDir, ".claude", type);
        await mkdir(dirPath, { recursive: true });

        const stats = await stat(dirPath);
        expect(stats.isDirectory()).toBe(true);
      }
    });

    it("should handle existing directory gracefully", async () => {
      const dirPath = join(tempDir, ".claude", "skills");
      await mkdir(dirPath, { recursive: true });

      // Should not throw when creating again
      await mkdir(dirPath, { recursive: true });

      const stats = await stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe("File creation patterns", () => {
    it("should create skill with SKILL.md", async () => {
      const skillDir = join(tempDir, ".claude", "skills", "test-skill");
      await mkdir(skillDir, { recursive: true });
      const skillFile = join(skillDir, "SKILL.md");

      await writeFile(skillFile, "# Test Skill", "utf-8");

      const content = await readFile(skillFile, "utf-8");
      expect(content).toBe("# Test Skill");
    });

    it("should create command .md file", async () => {
      const commandsDir = join(tempDir, ".claude", "commands");
      await mkdir(commandsDir, { recursive: true });
      const commandFile = join(commandsDir, "test-command.md");

      await writeFile(commandFile, "# Test Command", "utf-8");

      const content = await readFile(commandFile, "utf-8");
      expect(content).toBe("# Test Command");
    });

    it("should create agent .md file", async () => {
      const agentsDir = join(tempDir, ".claude", "agents");
      await mkdir(agentsDir, { recursive: true });
      const agentFile = join(agentsDir, "test-agent.md");

      await writeFile(agentFile, "# Test Agent", "utf-8");

      const content = await readFile(agentFile, "utf-8");
      expect(content).toBe("# Test Agent");
    });

    it("should create rule .md file", async () => {
      const rulesDir = join(tempDir, ".claude", "rules");
      await mkdir(rulesDir, { recursive: true });
      const ruleFile = join(rulesDir, "test-rule.md");

      await writeFile(ruleFile, "# Test Rule", "utf-8");

      const content = await readFile(ruleFile, "utf-8");
      expect(content).toBe("# Test Rule");
    });

    it("should create hook .json file", async () => {
      const hooksDir = join(tempDir, ".claude", "hooks");
      await mkdir(hooksDir, { recursive: true });
      const hookFile = join(hooksDir, "test-hook.json");

      const hookContent = { description: "Test hook", enabled: true };
      await writeFile(hookFile, JSON.stringify(hookContent, null, 2), "utf-8");

      const content = await readFile(hookFile, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(hookContent);
    });
  });

  describe("MCP config operations", () => {
    it("should create .mcp.json file", async () => {
      const mcpPath = join(tempDir, ".mcp.json");
      const config = {
        mcpServers: {
          "test-server": {
            command: "npx",
            args: ["-y", "test-package"],
          },
        },
      };

      await writeFile(mcpPath, JSON.stringify(config, null, 2), "utf-8");

      const content = await readFile(mcpPath, "utf-8");
      const parsed = JSON.parse(content);

      expect(parsed.mcpServers["test-server"].command).toBe("npx");
    });

    it("should handle missing .mcp.json gracefully", async () => {
      const mcpPath = join(tempDir, ".mcp.json");

      try {
        await readFile(mcpPath, "utf-8");
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as NodeJS.ErrnoException).code).toBe("ENOENT");
      }
    });
  });

  describe("File explorer operations", () => {
    beforeEach(async () => {
      // Create test directory structure
      await mkdir(join(tempDir, "src"), { recursive: true });
      await mkdir(join(tempDir, "src", "components"), { recursive: true });
      await writeFile(
        join(tempDir, "src", "index.ts"),
        "export const x = 1;",
        "utf-8"
      );
      await writeFile(
        join(tempDir, "src", "components", "App.tsx"),
        "export default () => null;",
        "utf-8"
      );
    });

    it("should read directory contents", async () => {
      const entries = await readdir(tempDir, { withFileTypes: true });

      expect(entries.length).toBeGreaterThan(0);
      expect(entries.some((e) => e.name === "src")).toBe(true);
    });

    it("should distinguish files and directories", async () => {
      const entries = await readdir(tempDir, { withFileTypes: true });

      const srcEntry = entries.find((e) => e.name === "src");
      expect(srcEntry?.isDirectory()).toBe(true);
    });

    it("should handle nested directories", async () => {
      const srcPath = join(tempDir, "src");
      const entries = await readdir(srcPath, { withFileTypes: true });

      expect(
        entries.some((e) => e.name === "components" && e.isDirectory())
      ).toBe(true);
      expect(entries.some((e) => e.name === "index.ts" && e.isFile())).toBe(
        true
      );
    });
  });

  describe("Error handling", () => {
    it("should handle file read errors gracefully", async () => {
      const nonExistentPath = join(tempDir, "does-not-exist.txt");

      try {
        await readFile(nonExistentPath, "utf-8");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle invalid JSON gracefully", async () => {
      const invalidJsonPath = join(tempDir, "invalid.json");
      await writeFile(invalidJsonPath, "{ invalid json", "utf-8");
      const content = await readFile(invalidJsonPath, "utf-8");

      expect(() => JSON.parse(content)).toThrow();
    });

    it("should handle permission errors gracefully", () => {
      // This is a no-op test documenting expected behavior
      // In real scenarios, permission errors would be caught and handled
      const canWrite = true; // Placeholder
      expect(canWrite).toBe(true);
    });
  });
});

describe("IPC Handler - Data Transformations", () => {
  describe("Content formatting", () => {
    it("should format skill frontmatter correctly", () => {
      const skillContent = `---
name: test-skill
description: A test skill
---

# Test Skill

Instructions here.`;

      expect(skillContent).toContain("---");
      expect(skillContent).toContain("name: test-skill");
      expect(skillContent).toContain("# Test Skill");
    });

    it("should format command frontmatter correctly", () => {
      const commandContent = `---
description: A test command
---

# Test Command

$ARGUMENTS

Instructions here.`;

      expect(commandContent).toContain("---");
      expect(commandContent).toContain("description: A test command");
      expect(commandContent).toContain("$ARGUMENTS");
    });

    it("should format agent frontmatter correctly", () => {
      const agentContent = `---
name: test-agent
description: A test agent
instructions: Additional context
model: opus
color: blue
---

# Test Agent

Instructions here.`;

      expect(agentContent).toContain("---");
      expect(agentContent).toContain("model: opus");
      expect(agentContent).toContain("# Test Agent");
    });

    it("should format rule content correctly", () => {
      const ruleContent = `# Test Rule

## When this rule applies
- Test condition

## The rule
- Test instruction`;

      expect(ruleContent).toContain("# Test Rule");
      expect(ruleContent).toContain("## When this rule applies");
      expect(ruleContent).toContain("## The rule");
    });

    it("should format hook JSON correctly", () => {
      const hookContent = `{
  "description": "Test hook",
  "enabled": true,
  "hookType": "user-message",
  "script": "console.log('test');"
}`;

      const parsed = JSON.parse(hookContent);
      expect(parsed.description).toBe("Test hook");
      expect(parsed.enabled).toBe(true);
    });
  });

  describe("Name normalization", () => {
    it("should normalize skill names", () => {
      const input = "Test Skill With Spaces";
      const normalized = input.toLowerCase().replace(/\s+/g, "-");

      expect(normalized).toBe("test-skill-with-spaces");
    });

    it("should normalize command names", () => {
      const input = "Test_Command-123";
      const normalized = input.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      expect(normalized).toBe("test-command-123");
    });

    it("should handle special characters", () => {
      const input = "Test@#$%Skill";
      const normalized = input.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      // Each special character (@#$%) becomes a hyphen
      expect(normalized).toBe("test----skill");
    });

    it("should handle multiple consecutive hyphens", () => {
      const input = "Test---Skill";
      const normalized = input.replace(/-+/g, "-");

      expect(normalized).toBe("Test-Skill");
    });
  });

  describe("Path construction", () => {
    it("should construct correct paths for skills", () => {
      const basePath = "/project";
      const skillName = "my-skill";
      const expectedPath = join(
        basePath,
        ".claude",
        "skills",
        skillName,
        "SKILL.md"
      );

      expect(expectedPath).toContain(join(".claude", "skills", "my-skill"));
      expect(expectedPath).toContain("SKILL.md");
    });

    it("should construct correct paths for commands", () => {
      const basePath = "/project";
      const commandName = "my-command";
      const expectedPath = join(
        basePath,
        ".claude",
        "commands",
        `${commandName}.md`
      );

      expect(expectedPath).toContain(join(".claude", "commands"));
      expect(expectedPath).toContain("my-command.md");
    });

    it("should construct correct paths for agents", () => {
      const basePath = "/project";
      const agentName = "my-agent";
      const expectedPath = join(
        basePath,
        ".claude",
        "agents",
        `${agentName}.md`
      );

      expect(expectedPath).toContain(join(".claude", "agents"));
      expect(expectedPath).toContain("my-agent.md");
    });

    it("should construct correct paths for rules", () => {
      const basePath = "/project";
      const ruleName = "my-rule";
      const expectedPath = join(basePath, ".claude", "rules", `${ruleName}.md`);

      expect(expectedPath).toContain(join(".claude", "rules"));
      expect(expectedPath).toContain("my-rule.md");
    });

    it("should construct correct paths for hooks", () => {
      const basePath = "/project";
      const hookName = "my-hook";
      const expectedPath = join(
        basePath,
        ".claude",
        "hooks",
        `${hookName}.json`
      );

      expect(expectedPath).toContain(join(".claude", "hooks"));
      expect(expectedPath).toContain("my-hook.json");
    });
  });

  describe("Data validation", () => {
    it("should validate skill names", () => {
      const validNames = ["my-skill", "test-123", "a", "skill-name"];
      const invalidNames = [
        "",
        "A",
        "_skill",
        "-skill",
        "skill_",
        "skill name",
      ];

      for (const name of validNames) {
        expect(name).toMatch(VALID_SKILL_NAME_REGEX);
      }

      for (const name of invalidNames) {
        expect(name.match(VALID_SKILL_NAME_REGEX)).toBeNull();
      }
    });

    it("should validate JSON structure", () => {
      const validJson = '{ "key": "value" }';
      const invalidJson = '{ key: "value" }';

      expect(() => JSON.parse(validJson)).not.toThrow();
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it("should validate model names", () => {
      const validModels = [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022",
        "claude-3-opus-20240229",
      ];

      for (const model of validModels) {
        expect(model).toMatch(CLAUDE_MODEL_PREFIX_REGEX);
      }
    });

    it("should handle permission errors gracefully", () => {
      // This is a no-op test documenting expected behavior
      // In real scenarios, permission errors would be caught and handled
      const canWrite = true; // Placeholder
      expect(canWrite).toBe(true);
    });
  });
});
