/**
 * Test script for the directory reader abstraction layer
 */

import { readClaudeDirectory } from "./src/ipc/claude/directory-reader";

const projectPath = "/Users/damienschneider/Documents/GitHub/electron-shadcn";

async function testCommands() {
  console.log("\n🧪 Testing Commands Directory Reading\n");
  console.log("📁 Path:", projectPath);

  try {
    const result = await readClaudeDirectory(projectPath, "commands");

    console.log("\n📊 Results:");
    console.log(`  Directory: ${result.path}`);
    console.log(`  Type: ${result.type}`);
    console.log(`  Files found: ${result.files.length}`);

    console.log("\n📝 Files:");
    for (const file of result.files) {
      console.log(`  - ${file.name}`);
      console.log(`    Path: ${file.path}`);
      console.log(`    Type: ${file.type}`);
      console.log(`    Category: ${file.category || "none"}`);
      console.log(`    Content length: ${file.content?.length || 0} chars`);
      console.log("");
    }

    // Verify expectations
    const tmFiles = result.files.filter((f) => f.category === "tm");
    console.log(`✅ Found ${tmFiles.length} commands in 'tm' category`);

    // Check that we don't have 'tm' as a command name
    const tmAsCommand = result.files.find((f) => f.name === "tm");
    if (tmAsCommand) {
      console.log('❌ ERROR: "tm" folder is being treated as a command!');
      return false;
    }
    console.log('✅ "tm" folder is NOT treated as a command (correct!)');

    // Check that we have the expected commands
    const expectedCommands = [
      "add-dependency",
      "add-subtask",
      "add-task",
      "help",
      "tm-main",
    ];
    for (const expected of expectedCommands) {
      const found = result.files.some(
        (f) => f.name.endsWith(expected) || f.name === expected
      );
      if (found) {
        console.log(`✅ Found expected command: ${expected}`);
      } else {
        console.log(`❌ Missing expected command: ${expected}`);
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

async function testSkills() {
  console.log("\n🧪 Testing Skills Directory Reading\n");

  try {
    const result = await readClaudeDirectory(projectPath, "skills");

    console.log(`📁 Skills directory: ${result.files.length} items found`);
    for (const file of result.files) {
      console.log(`  - ${file.name} (${file.type})`);
    }

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting Directory Reader Tests\n");
  console.log("=".repeat(50));

  const commandsTest = await testCommands();
  const skillsTest = await testSkills();

  console.log("\n" + "=".repeat(50));
  console.log("\n📈 Summary:");
  console.log(`  Commands: ${commandsTest ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`  Skills: ${skillsTest ? "✅ PASSED" : "❌ FAILED"}`);

  if (commandsTest && skillsTest) {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some tests failed.");
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("❌ Test runner error:", error);
  process.exit(1);
});
