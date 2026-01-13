import { describe, expect, it } from "vitest";
import type { ContentBlock } from "@/renderer/stores/chat-atoms";
import { formatMessageContent } from "@/renderer/stores/chat-atoms";

describe("formatMessageContent - tool_result blocks", () => {
  it("should format tool_result block as markdown", () => {
    const content: ContentBlock[] = [
      {
        type: "tool_result",
        content: "No files found",
      },
    ];
    const result = formatMessageContent(content);
    expect(result).toContain("```tool_result");
    expect(result).toContain("No files found");
    expect(result).toContain("```");
  });

  it("should format tool_result block with multi-line content", () => {
    const content: ContentBlock[] = [
      {
        type: "tool_result",
        content:
          "1→ 2→import { atom } from 'jotai';\n3→import { atomWithStorage } from 'jotai/utils';",
      },
    ];
    const result = formatMessageContent(content);
    expect(result).toContain("```tool_result");
    expect(result).toContain("1→ 2→import { atom }");
    expect(result).toContain("```");
  });

  it("should format tool_result block with object content", () => {
    const content: ContentBlock[] = [
      {
        type: "tool_result",
        content: [{ status: "success", count: 2 }],
      },
    ];
    const result = formatMessageContent(content);
    expect(result).toContain("```tool_result");
    expect(result).toContain('{"status":"success"');
    expect(result).toContain("```");
  });

  it("should format mixed text and tool_result blocks", () => {
    const content: ContentBlock[] = [
      {
        type: "text",
        text: "Checking files...",
      },
      {
        type: "tool_result",
        content: "No files found",
      },
    ];
    const result = formatMessageContent(content);
    expect(result).toContain("Checking files...");
    expect(result).toContain("```tool_result");
    expect(result).toContain("No files found");
  });
});
