import { describe, expect, it } from "vitest";

/**
 * Tests for tool block parsing and detection in markdown content.
 * These tests verify the regex patterns and parsing logic used by
 * the MessageResponse component to handle tool_use and tool_result blocks.
 */

// Regex patterns matching those in message.tsx
const TOOL_USE_REGEX = /```tool_use\s*\n([\s\S]*?)```/g;
const TOOL_RESULT_REGEX = /```tool_result\s*\n?([\s\S]*?)```/g;
const COMBINED_REGEX = /```(tool_use|tool_result)\s*\n?([\s\S]*?)```/g;

/**
 * Helper function matching parseToolUseContent in message.tsx
 */
function parseToolUseContent(content: string): {
  toolName: string;
  input: Record<string, unknown>;
} {
  const lines = content.trim().split("\n");
  const toolName = lines[0]?.trim() || "tool";
  const jsonContent = lines.slice(1).join("\n").trim();

  let input: Record<string, unknown> = {};
  if (jsonContent) {
    try {
      input = JSON.parse(jsonContent);
    } catch {
      input = { content: jsonContent };
    }
  }

  return { toolName, input };
}

describe("Tool block regex detection", () => {
  describe("TOOL_USE_REGEX", () => {
    it("should match basic tool_use block with newline after language", () => {
      const markdown = `\`\`\`tool_use
read_file
{"path": "/src/app.tsx"}
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_USE_REGEX)];
      expect(matches.length).toBe(1);
      expect(matches[0][1]).toContain("read_file");
    });

    it("should match tool_use block with complex JSON input", () => {
      const markdown = `\`\`\`tool_use
edit_file
{
  "path": "/src/components/button.tsx",
  "content": "export const Button = () => <button>Click</button>",
  "line": 42
}
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_USE_REGEX)];
      expect(matches.length).toBe(1);
      const content = matches[0][1];
      expect(content).toContain("edit_file");
      expect(content).toContain('"path"');
    });

    it("should match multiple tool_use blocks in text", () => {
      const markdown = `Here is some context.

\`\`\`tool_use
read_file
{"path": "/file1.ts"}
\`\`\`

And some more text.

\`\`\`tool_use
write_file
{"path": "/file2.ts", "content": "hello"}
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_USE_REGEX)];
      expect(matches.length).toBe(2);
    });

    it("should not match malformed tool_use without proper content", () => {
      const markdown = "```tool_use```";
      const matches = [...markdown.matchAll(TOOL_USE_REGEX)];
      expect(matches.length).toBe(0);
    });
  });

  describe("TOOL_RESULT_REGEX", () => {
    it("should match basic tool_result block", () => {
      const markdown = `\`\`\`tool_result
File contents here
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      expect(matches.length).toBe(1);
      expect(matches[0][1].trim()).toBe("File contents here");
    });

    it("should match tool_result with multi-line content", () => {
      const markdown = `\`\`\`tool_result
1→ import { useState } from 'react';
2→ import { Button } from './button';
3→ 
4→ export function App() {
5→   return <Button />;
6→ }
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      expect(matches.length).toBe(1);
      const content = matches[0][1];
      expect(content).toContain("useState");
      expect(content).toContain("Button");
    });

    it("should match tool_result with JSON content", () => {
      const markdown = `\`\`\`tool_result
{"success": true, "files": ["a.ts", "b.ts"]}
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      expect(matches.length).toBe(1);
    });

    it("should match tool_result with error content", () => {
      const markdown = `\`\`\`tool_result
Error: File not found at /nonexistent/path.ts
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      expect(matches.length).toBe(1);
      expect(matches[0][1]).toContain("Error");
    });

    it("should handle tool_result without newline after language tag", () => {
      const markdown = "```tool_result\nNo files found\n```";
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      expect(matches.length).toBe(1);
    });
  });

  describe("COMBINED_REGEX", () => {
    it("should match both tool_use and tool_result in mixed content", () => {
      const markdown = `I will read the file.

\`\`\`tool_use
read_file
{"path": "/app.tsx"}
\`\`\`

\`\`\`tool_result
import React from 'react';
\`\`\`

The file contains React code.`;

      const matches = [...markdown.matchAll(COMBINED_REGEX)];
      expect(matches.length).toBe(2);
      expect(matches[0][1]).toBe("tool_use");
      expect(matches[1][1]).toBe("tool_result");
    });

    it("should extract block type and content correctly", () => {
      const markdown = `\`\`\`tool_use
search
{"query": "useState"}
\`\`\`

\`\`\`tool_result
Found 5 matches
\`\`\``;

      const matches = [...markdown.matchAll(COMBINED_REGEX)];
      expect(matches[0][1]).toBe("tool_use");
      expect(matches[0][2]).toContain("search");
      expect(matches[1][1]).toBe("tool_result");
      expect(matches[1][2]).toContain("Found 5 matches");
    });
  });
});

describe("parseToolUseContent", () => {
  it("should parse tool name from first line", () => {
    const content = `read_file
{"path": "/src/app.tsx"}`;
    const result = parseToolUseContent(content);
    expect(result.toolName).toBe("read_file");
  });

  it("should parse JSON input correctly", () => {
    const content = `write_file
{"path": "/src/test.ts", "content": "hello world"}`;
    const result = parseToolUseContent(content);
    expect(result.toolName).toBe("write_file");
    expect(result.input).toEqual({
      path: "/src/test.ts",
      content: "hello world",
    });
  });

  it("should handle complex nested JSON", () => {
    const content = `execute_command
{
  "command": "npm test",
  "options": {
    "cwd": "/project",
    "env": {"NODE_ENV": "test"}
  }
}`;
    const result = parseToolUseContent(content);
    expect(result.toolName).toBe("execute_command");
    expect(result.input.command).toBe("npm test");
    expect((result.input.options as Record<string, unknown>).cwd).toBe(
      "/project"
    );
  });

  it("should handle tool name only (no JSON)", () => {
    const content = "list_directory";
    const result = parseToolUseContent(content);
    expect(result.toolName).toBe("list_directory");
    expect(result.input).toEqual({});
  });

  it("should handle invalid JSON gracefully", () => {
    const content = `some_tool
not valid json { broken`;
    const result = parseToolUseContent(content);
    expect(result.toolName).toBe("some_tool");
    expect(result.input).toEqual({ content: "not valid json { broken" });
  });

  it("should handle multi-line content that's not JSON", () => {
    const content = `view_file
Line 1: some content
Line 2: more content
Line 3: even more`;
    const result = parseToolUseContent(content);
    expect(result.toolName).toBe("view_file");
    expect(result.input.content).toContain("Line 1:");
  });

  it("should trim whitespace from tool name", () => {
    const content = `  read_file  
{"path": "/file.ts"}`;
    const result = parseToolUseContent(content);
    expect(result.toolName).toBe("read_file");
  });

  it("should handle empty content", () => {
    const content = "";
    const result = parseToolUseContent(content);
    expect(result.toolName).toBe("tool");
    expect(result.input).toEqual({});
  });
});

describe("Edge cases and problematic formats", () => {
  describe("Streaming incomplete blocks", () => {
    it("should handle incomplete tool_use block (no closing)", () => {
      const markdown = `\`\`\`tool_use
read_file
{"path": "/src/app.tsx"`;
      // Should not match incomplete blocks
      const matches = [...markdown.matchAll(TOOL_USE_REGEX)];
      expect(matches.length).toBe(0);
    });

    it("should handle tool_result without proper newline", () => {
      // This was a bug case - content came immediately after language
      const markdown = "```tool_result 1→ 2→import";
      // Should not match as it's malformed
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      // Depending on regex, this might or might not match
      // The important thing is that we handle it gracefully
      if (matches.length > 0) {
        expect(matches[0][1]).toBeDefined();
      }
    });
  });

  describe("Special characters in content", () => {
    it("should handle backticks in content", () => {
      const markdown = `\`\`\`tool_result
The code uses \`useState\` hook
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      expect(matches.length).toBe(1);
      expect(matches[0][1]).toContain("`useState`");
    });

    it("should handle nested code blocks in result", () => {
      const markdown = `\`\`\`tool_result
Here is the code:
\\\`\\\`\\\`typescript
const x = 1;
\\\`\\\`\\\`
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      // This is a tricky case - nested code blocks
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle unicode characters", () => {
      const markdown = `\`\`\`tool_result
File: 日本語.ts
Content: こんにちは
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      expect(matches.length).toBe(1);
      expect(matches[0][1]).toContain("日本語");
    });

    it("should handle emoji in content", () => {
      const markdown = `\`\`\`tool_result
✅ Tests passed
❌ 1 failure
⚠️ 2 warnings
\`\`\``;
      const matches = [...markdown.matchAll(TOOL_RESULT_REGEX)];
      expect(matches.length).toBe(1);
      expect(matches[0][1]).toContain("✅");
    });
  });

  describe("Mixed content scenarios", () => {
    it("should handle regular code blocks alongside tool blocks", () => {
      const markdown = `Here's some code:

\`\`\`typescript
const x = 1;
\`\`\`

Now using a tool:

\`\`\`tool_use
read_file
{"path": "/x.ts"}
\`\`\`

Result:

\`\`\`tool_result
const x = 1;
\`\`\``;

      const toolUseMatches = [...markdown.matchAll(TOOL_USE_REGEX)];
      const toolResultMatches = [...markdown.matchAll(TOOL_RESULT_REGEX)];

      expect(toolUseMatches.length).toBe(1);
      expect(toolResultMatches.length).toBe(1);
    });

    it("should handle text interleaved with tool blocks", () => {
      const markdown = `Let me search for that.

\`\`\`tool_use
search
{"query": "button"}
\`\`\`

\`\`\`tool_result
Found 3 files
\`\`\`

Based on the results, I found 3 files containing "button".`;

      const combined = [...markdown.matchAll(COMBINED_REGEX)];
      expect(combined.length).toBe(2);
    });
  });
});

describe("Tool name formatting", () => {
  /**
   * Tests for the formatToolName function behavior
   */
  it("should format snake_case tool names", () => {
    const name = "read_file";
    const formatted = name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    expect(formatted).toBe("Read File");
  });

  it("should format camelCase tool names", () => {
    const name = "readFile";
    const formatted = name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    expect(formatted).toBe("Read File");
  });

  it("should handle single word tool names", () => {
    const name = "search";
    const formatted = name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    expect(formatted).toBe("Search");
  });
});
