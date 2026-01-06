import { readdir, readFile } from "fs/promises";

// Test reading the CLAUDE.md file directly
async function testReadFile() {
  const testPath =
    "/Users/damienschneider/Documents/GitHub/electron-shadcn/CLAUDE.md";

  try {
    const content = await readFile(testPath, "utf-8");
    console.log("File read successfully!");
    console.log("Content length:", content.length);
    console.log("Content:", content);
    return { success: true, content };
  } catch (error) {
    console.error("Error reading file:", error);
    return { success: false, error: error.message };
  }
}

// Test reading the directory
async function testReadDirectory() {
  const testPath = "/Users/damienschneider/Documents/GitHub/electron-shadcn";

  try {
    const entries = await readdir(testPath, { withFileTypes: true });
    console.log("Directory read successfully!");
    console.log(
      "Entries:",
      entries.map((e) => ({
        name: e.name,
        isFile: e.isFile(),
        isDir: e.isDirectory(),
      }))
    );
    return { success: true, count: entries.length };
  } catch (error) {
    console.error("Error reading directory:", error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("=== Testing File Reading ===");
  await testReadFile();
  console.log("\n=== Testing Directory Reading ===");
  await testReadDirectory();
}

main().catch(console.error);
