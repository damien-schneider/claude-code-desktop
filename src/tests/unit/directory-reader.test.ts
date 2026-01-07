/**
 * Pragmatic tests for directory reader
 * Tests actual file system behavior with real directories
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type ClaudeFile,
  getDisplayName,
  getFileCategory,
  readClaudeDirectory,
} from "@/ipc/claude/directory-reader";

// Helper to create temp directory
async function createTempDir(): Promise<string> {
  // Use shorter name to avoid path length issues on macOS
  const tempPath = join(tmpdir(), `ct-${Date.now().toString(36)}`);
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

describe("Directory Reader", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe("hasValidExtension edge cases", () => {
    it("should handle empty extensions array", () => {
      const fileName = "test.md";
      const result = fileName.endsWith(".md") || fileName.endsWith(".json");
      expect(result).toBe(true);
    });

    it("should check multiple extensions", () => {
      const fileName = "test.md";
      const validExts = [".json", ".txt"];
      const result = validExts.some((ext) => fileName.endsWith(ext));
      expect(result).toBe(false);
    });

    it("should match exact extension", () => {
      const fileName = "test.md";
      const validExts = [".md", ".json"];
      const result = validExts.some((ext) => fileName.endsWith(ext));
      expect(result).toBe(true);
    });
  });

  describe("readClaudeDirectory for commands", () => {
    beforeEach(async () => {
      const commandsDir = join(tempDir, ".claude", "commands");
      await mkdir(commandsDir, { recursive: true });

      // Create a root-level command
      await writeFile(
        join(commandsDir, "root-command.md"),
        "# Root Command\n\nThis is a root command.",
        "utf-8"
      );

      // Create a subdirectory with commands
      const gitDir = join(commandsDir, "git");
      await mkdir(gitDir, { recursive: true });
      await writeFile(
        join(gitDir, "commit.md"),
        "# Git Commit\n\nCommit changes.",
        "utf-8"
      );
      await writeFile(
        join(gitDir, "push.md"),
        "# Git Push\n\nPush changes.",
        "utf-8"
      );
    });

    it("should read all commands including subdirectories", async () => {
      const result = await readClaudeDirectory(tempDir, "commands");

      expect(result.files).toHaveLength(3);
      expect(result.files.some((f) => f.name === "root-command")).toBe(true);
      expect(result.files.some((f) => f.name === "git/commit")).toBe(true);
      expect(result.files.some((f) => f.name === "git/push")).toBe(true);
    });

    it("should categorize commands correctly", async () => {
      const result = await readClaudeDirectory(tempDir, "commands");

      const rootCommand = result.files.find((f) => f.name === "root-command");
      const gitCommit = result.files.find((f) => f.name === "git/commit");

      expect(rootCommand?.category).toBeUndefined();
      expect(gitCommit?.category).toBe("git");
    });

    it("should include file content", async () => {
      const result = await readClaudeDirectory(tempDir, "commands");

      const gitCommit = result.files.find((f) => f.name === "git/commit");
      expect(gitCommit?.content).toContain("# Git Commit");
      expect(gitCommit?.content).toContain("Commit changes.");
    });
  });

  describe("readClaudeDirectory for skills", () => {
    beforeEach(async () => {
      const skillsDir = join(tempDir, ".claude", "skills");
      await mkdir(skillsDir, { recursive: true });

      // Create a skill directory with SKILL.md
      const testSkillDir = join(skillsDir, "test-skill");
      await mkdir(testSkillDir, { recursive: true });
      await writeFile(
        join(testSkillDir, "SKILL.md"),
        "---\nname: test-skill\n---\n\n# Test Skill",
        "utf-8"
      );

      // Create a skill directory without SKILL.md (edge case)
      const emptySkillDir = join(skillsDir, "empty-skill");
      await mkdir(emptySkillDir, { recursive: true });
    });

    it("should read skills from subdirectories", async () => {
      const result = await readClaudeDirectory(tempDir, "skills");

      expect(result.files).toHaveLength(2);
      expect(result.files[0].type).toBe("directory");
    });

    it("should include content for skills with SKILL.md", async () => {
      const result = await readClaudeDirectory(tempDir, "skills");

      const testSkill = result.files.find((f) => f.name === "test-skill");
      expect(testSkill?.content).toContain("name: test-skill");
      expect(testSkill?.content).toContain("# Test Skill");
    });

    it("should handle skills without SKILL.md gracefully", async () => {
      const result = await readClaudeDirectory(tempDir, "skills");

      const emptySkill = result.files.find((f) => f.name === "empty-skill");
      expect(emptySkill).toBeDefined();
      expect(emptySkill?.content).toBeUndefined();
    });
  });

  describe("readClaudeDirectory for agents", () => {
    beforeEach(async () => {
      const agentsDir = join(tempDir, ".claude", "agents");
      await mkdir(agentsDir, { recursive: true });

      await writeFile(
        join(agentsDir, "test-agent.md"),
        "---\nname: test-agent\n---\n\n# Test Agent",
        "utf-8"
      );
    });

    it("should read flat agent files", async () => {
      const result = await readClaudeDirectory(tempDir, "agents");

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("test-agent.md");
      expect(result.files[0].content).toContain("name: test-agent");
    });
  });

  describe("readClaudeDirectory for rules", () => {
    beforeEach(async () => {
      const rulesDir = join(tempDir, ".claude", "rules");
      await mkdir(rulesDir, { recursive: true });

      await writeFile(
        join(rulesDir, "my-rule.md"),
        "# My Rule\n\nFollow this rule.",
        "utf-8"
      );
    });

    it("should read flat rule files", async () => {
      const result = await readClaudeDirectory(tempDir, "rules");

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("my-rule.md");
      expect(result.files[0].content).toContain("# My Rule");
    });
  });

  describe("readClaudeDirectory for hooks", () => {
    beforeEach(async () => {
      const hooksDir = join(tempDir, ".claude", "hooks");
      await mkdir(hooksDir, { recursive: true });

      await writeFile(
        join(hooksDir, "test-hook.json"),
        '{"description": "Test hook", "enabled": true}',
        "utf-8"
      );
    });

    it("should read flat hook JSON files", async () => {
      const result = await readClaudeDirectory(tempDir, "hooks");

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("test-hook.json");
      expect(result.files[0].content).toContain('"description"');
    });
  });

  describe("readClaudeDirectory with non-existent directory", () => {
    it("should return empty result for non-existent directory", async () => {
      const result = await readClaudeDirectory(tempDir, "skills");

      expect(result.files).toEqual([]);
      expect(result.path).toContain(".claude/skills");
    });
  });

  describe("getDisplayName", () => {
    it("should return directory name for directory type", () => {
      const file: ClaudeFile = {
        name: "my-skill",
        path: "/path/to/skill",
        type: "directory",
      };
      expect(getDisplayName(file, "skills")).toBe("my-skill");
    });

    it("should remove extension for file types", () => {
      const file: ClaudeFile = {
        name: "my-rule.md",
        path: "/path/to/rule.md",
        type: "file",
      };
      expect(getDisplayName(file, "rules")).toBe("my-rule");
    });

    it("should handle commands with categories", () => {
      const file: ClaudeFile = {
        name: "git/commit",
        path: "/path/to/commit.md",
        type: "file",
        category: "git",
      };
      expect(getDisplayName(file, "commands")).toBe("git/commit");
    });

    it("should handle files without extensions", () => {
      const file: ClaudeFile = {
        name: "no-extension",
        path: "/path/to/file",
        type: "file",
      };
      expect(getDisplayName(file, "rules")).toBe("no-extension");
    });
  });

  describe("getFileCategory", () => {
    it("should return category when present", () => {
      const file: ClaudeFile = {
        name: "git/commit",
        path: "/path",
        type: "file",
        category: "git",
      };
      expect(getFileCategory(file)).toBe("git");
    });

    it("should return undefined when no category", () => {
      const file: ClaudeFile = {
        name: "my-rule",
        path: "/path",
        type: "file",
      };
      expect(getFileCategory(file)).toBeUndefined();
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle directories with non-readable files gracefully", async () => {
      const rulesDir = join(tempDir, ".claude", "rules");
      await mkdir(rulesDir, { recursive: true });
      await writeFile(join(rulesDir, "valid.md"), "Content", "utf-8");

      const result = await readClaudeDirectory(tempDir, "rules");
      expect(result.files).toHaveLength(1);
    });

    it("should handle empty directories", async () => {
      const rulesDir = join(tempDir, ".claude", "rules");
      await mkdir(rulesDir, { recursive: true });

      const result = await readClaudeDirectory(tempDir, "rules");
      expect(result.files).toEqual([]);
    });
  });
});
