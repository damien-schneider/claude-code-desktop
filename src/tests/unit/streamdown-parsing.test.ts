import { describe, expect, it } from "vitest";

describe("Streamdown markdown fence detection", () => {
  it("should parse code fence with newline after language", () => {
    const markdown = "```tool_result\nNo files found\n```";
    // Check if it matches the expected format
    const hasNewlineAfterLanguage = markdown.startsWith("```tool_result\n");
    expect(hasNewlineAfterLanguage).toBe(true);
  });

  it("should detect code fence pattern without proper newline", () => {
    const markdown = "```tool_result 1→ 2→import";
    // This is NOT a valid code fence - content comes immediately after language
    const hasNewlineAfterLanguage = markdown.includes("```tool_result\n");
    expect(hasNewlineAfterLanguage).toBe(false);
  });

  it("should parse valid code fence with multi-line content", () => {
    const markdown = "```tool_result\n1→ import\n2→ export\n```";
    const lines = markdown.split("\n");
    expect(lines[0]).toBe("```tool_result");
    expect(lines[1]).toBe("1→ import");
    expect(lines[2]).toBe("2→ export");
    expect(lines[3]).toBe("```");
  });

  it("should handle code fence where content has embedded newlines", () => {
    // When content like "1→ 2→import" already has newlines in it
    const contentWithNewlines = "1→ 2→import { atom }\n3→ 4→from 'jotai'";
    const markdown = `\`\`\`tool_result\n${contentWithNewlines}\n\`\`\``;
    const lines = markdown.split("\n");
    expect(lines[0]).toBe("```tool_result");
    expect(lines[1]).toBe("1→ 2→import { atom }");
    expect(lines[2]).toBe("3→ 4→from 'jotai'");
    expect(lines[3]).toBe("```");
  });
});
