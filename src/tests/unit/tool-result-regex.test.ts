import { describe, expect, it } from "vitest";

// Test the regex pattern for extracting tool_result from markdown
const TOOL_RESULT_REGEX = /```tool_result\s?\n?([\s\S]*?)```/;

describe("TOOL_RESULT_REGEX", () => {
  it("should extract tool_result content with newline after fence", () => {
    const text = "```tool_result\nNo files found\n```";
    const match = text.match(TOOL_RESULT_REGEX);
    expect(match?.[1]?.trim()).toBe("No files found");
  });

  it("should extract tool_result content without newline after fence", () => {
    const text = "```tool_result Checked 2 files in 10ms```";
    const match = text.match(TOOL_RESULT_REGEX);
    expect(match?.[1]?.trim()).toBe("Checked 2 files in 10ms");
  });

  it("should extract multi-line tool_result content", () => {
    const text =
      "```tool_result\n1→ 2→import { atom } from 'jotai';\n3→import { atomWithStorage } from 'jotai/utils';\n```";
    const match = text.match(TOOL_RESULT_REGEX);
    expect(match?.[1]?.trim()).toBe(
      "1→ 2→import { atom } from 'jotai';\n3→import { atomWithStorage } from 'jotai/utils';"
    );
  });

  it("should not match regular markdown code blocks", () => {
    const text = "```javascript\nconst x = 1;\n```";
    const match = text.match(TOOL_RESULT_REGEX);
    expect(match).toBeNull();
  });

  it("should extract tool_result from text with content before and after", () => {
    const text =
      "Some text before ```tool_result\nResult content\n``` some text after";
    const match = text.match(TOOL_RESULT_REGEX);
    expect(match?.[1]?.trim()).toBe("Result content");
  });
});
