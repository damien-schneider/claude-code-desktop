/**
 * Test script for Claude Code Manager components
 * This script verifies that all Claude components (commands, rules, skills, hooks, agents)
 * are correctly loaded and parsed from the sample .claude folder.
 */

import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const SAMPLE_DIR = join(process.cwd(), ".claude-sample");

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testDirectoryExists(
  dir: string,
  name: string
): Promise<TestResult> {
  const exists = existsSync(dir);
  return {
    name: `Directory exists: ${name}`,
    passed: exists,
    message: exists
      ? `Directory ${name} exists`
      : `Directory ${name} does not exist`,
    details: { path: dir },
  };
}

async function testFilesInDirectory(
  dir: string,
  pattern: RegExp,
  name: string
): Promise<TestResult> {
  try {
    const files = await readdir(dir);
    const matchedFiles = files.filter((f) => pattern.test(f));
    return {
      name: `Files in ${name}`,
      passed: matchedFiles.length > 0,
      message: `Found ${matchedFiles.length} file(s) matching ${pattern}`,
      details: { files: matchedFiles },
    };
  } catch (error) {
    return {
      name: `Files in ${name}`,
      passed: false,
      message: `Failed to read directory: ${(error as Error).message}`,
    };
  }
}

async function testCommandFormat(filePath: string): Promise<TestResult> {
  try {
    const content = await readFile(filePath, "utf-8");

    // Check for $ARGUMENTS placeholder
    const hasArguments = content.includes("$ARGUMENTS");

    // Check for description (with or without frontmatter)
    const hasDescription = content.includes("description:");

    // Check for meaningful content
    const hasContent = content.length > 50;

    return {
      name: `Command format: ${filePath}`,
      passed: hasArguments && hasDescription && hasContent,
      message:
        hasArguments && hasDescription && hasContent
          ? "Command has proper format"
          : "Command missing required elements",
      details: {
        hasArguments,
        hasDescription,
        hasContent,
        contentLength: content.length,
      },
    };
  } catch (error) {
    return {
      name: `Command format: ${filePath}`,
      passed: false,
      message: `Failed to read file: ${(error as Error).message}`,
    };
  }
}

async function testHookFormat(filePath: string): Promise<TestResult> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);

    const hasName = !!parsed.name;
    const hasHookType = !!parsed.hookType;
    const validHookType = [
      "SessionStart",
      "PromptSubmit",
      "ToolUse",
      "ToolOutput",
      "Response",
      "SessionEnd",
    ].includes(parsed.hookType);
    const hasScript = !!parsed.script || !!parsed.onSubmit || !!parsed.onStart;

    return {
      name: `Hook format: ${filePath}`,
      passed: hasName && hasHookType && validHookType && hasScript,
      message:
        hasName && hasHookType && validHookType && hasScript
          ? "Hook has proper format"
          : "Hook missing required elements",
      details: {
        hasName,
        hasHookType,
        validHookType,
        hasScript,
        hookType: parsed.hookType,
      },
    };
  } catch (error) {
    return {
      name: `Hook format: ${filePath}`,
      passed: false,
      message: `Failed to parse hook: ${(error as Error).message}`,
    };
  }
}

async function testSkillFormat(filePath: string): Promise<TestResult> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);

    const hasName = !!parsed.name;
    const hasDescription = !!parsed.description;
    const hasContent = !!parsed.content;

    return {
      name: `Skill format: ${filePath}`,
      passed: hasName && hasDescription && hasContent,
      message:
        hasName && hasDescription && hasContent
          ? "Skill has proper format"
          : "Skill missing required elements",
      details: {
        hasName,
        hasDescription,
        hasContent,
        name: parsed.name,
      },
    };
  } catch (error) {
    return {
      name: `Skill format: ${filePath}`,
      passed: false,
      message: `Failed to parse skill: ${(error as Error).message}`,
    };
  }
}

async function runTests() {
  console.log("🧪 Running Claude Code Manager Tests\n");
  console.log(`📁 Sample directory: ${SAMPLE_DIR}\n`);

  // Test 1: Main directory exists
  results.push(await testDirectoryExists(SAMPLE_DIR, ".claude-sample"));

  // Test 2-6: Subdirectories exist
  const subdirs = ["commands", "rules", "skills", "hooks", "agents"];
  for (const subdir of subdirs) {
    results.push(await testDirectoryExists(join(SAMPLE_DIR, subdir), subdir));
  }

  // Test 7: Commands subdirectories
  const commandsDir = join(SAMPLE_DIR, "commands");
  results.push(
    await testDirectoryExists(join(commandsDir, "git"), "commands/git")
  );
  results.push(
    await testDirectoryExists(join(commandsDir, "testing"), "commands/testing")
  );
  results.push(
    await testDirectoryExists(
      join(commandsDir, "code-quality"),
      "commands/code-quality"
    )
  );

  // Test 8: Command files exist
  const commandFiles = [
    join(commandsDir, "git/commit.md"),
    join(commandsDir, "testing/run-tests.md"),
    join(commandsDir, "code-quality/lint.md"),
  ];
  for (const file of commandFiles) {
    results.push(await testCommandFormat(file));
  }

  // Test 9: Hook files exist and have correct format
  const hooksDir = join(SAMPLE_DIR, "hooks");
  results.push(await testHookFormat(join(hooksDir, "SessionStart.json")));
  results.push(await testHookFormat(join(hooksDir, "PromptSubmit.json")));

  // Test 10: Skill files exist and have correct format
  const skillsDir = join(SAMPLE_DIR, "skills");
  results.push(await testSkillFormat(join(skillsDir, "create-component.json")));

  // Test 11: Rule files exist
  const rulesDir = join(SAMPLE_DIR, "rules");
  results.push(await testFilesInDirectory(rulesDir, /\.md$/, "rules"));

  // Test 12: Agent files exist
  const agentsDir = join(SAMPLE_DIR, "agents");
  results.push(await testFilesInDirectory(agentsDir, /\.md$/, "agents"));

  // Print results
  console.log("\n📊 Test Results:\n");
  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.details && !result.passed) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    if (result.passed) passed++;
    else failed++;
  }

  console.log(
    `\n📈 Summary: ${passed} passed, ${failed} failed out of ${results.length} tests`
  );

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some tests failed. Please check the results above.");
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("❌ Test runner error:", error);
  process.exit(1);
});
