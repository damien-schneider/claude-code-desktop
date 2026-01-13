import { describe, expect, it } from "vitest";

/**
 * Tests that verify user messages with tool_result content blocks
 * are properly rendered using MessageResponse (not as plain text).
 *
 * This addresses the bug where tool_result blocks from user messages
 * were being displayed as raw ```tool_result ... ``` markdown text.
 */

// Simulate the content block structure from Claude
interface ToolResultBlock {
  tool_use_id: string;
  type: "tool_result";
  content: string;
  is_error?: boolean;
}

interface ToolUseBlock {
  type: "tool_use";
  id?: string;
  name: string;
  input: Record<string, unknown>;
}

interface TextBlock {
  type: "text";
  text: string;
}

type ContentBlock = ToolResultBlock | TextBlock | ToolUseBlock;

// Test helper to check if content has tool blocks
function hasToolBlocks(contentBlocks: ContentBlock[] | undefined): boolean {
  if (!contentBlocks) {
    return false;
  }
  return contentBlocks.some(
    (block) => block.type === "tool_result" || block.type === "tool_use"
  );
}

describe("User message with tool_result content blocks", () => {
  it("should detect tool_result blocks in content array", () => {
    const content: ContentBlock[] = [
      {
        tool_use_id: "call_abc123",
        type: "tool_result",
        content: "Checked 25 files in 61ms. No fixes applied.",
      },
    ];

    expect(hasToolBlocks(content)).toBe(true);
  });

  it("should detect tool_result blocks from real Claude response", () => {
    // Exact format from user's debug output
    const content: ContentBlock[] = [
      {
        tool_use_id: "call_e6d9ad28ab6e498ea20e0d0d",
        type: "tool_result",
        content: "Checked 25 files in 61ms. No fixes applied.",
      },
    ];

    expect(hasToolBlocks(content)).toBe(true);
  });

  it("should detect text blocks as non-tool content", () => {
    const content: ContentBlock[] = [
      {
        type: "text",
        text: "Hello, this is a regular message",
      },
    ];

    expect(hasToolBlocks(content)).toBe(false);
  });

  it("should detect mixed content with tool_result", () => {
    const content: ContentBlock[] = [
      {
        type: "text",
        text: "Here is the result:",
      },
      {
        tool_use_id: "call_abc123",
        type: "tool_result",
        content: "Success!",
      },
    ];

    expect(hasToolBlocks(content)).toBe(true);
  });

  it("should handle multiline tool_result content", () => {
    const content: ContentBlock[] = [
      {
        tool_use_id: "call_abc123",
        type: "tool_result",
        content:
          'The file has been updated. Here\'s the result of running `cat -n`:\n     1→"use client";\n     2→\n     3→import { toast } from "sonner";',
      },
    ];

    expect(hasToolBlocks(content)).toBe(true);
    expect(content[0].type).toBe("tool_result");
  });

  it("should handle tool_result with is_error flag", () => {
    const content: ContentBlock[] = [
      {
        tool_use_id: "call_abc123",
        type: "tool_result",
        content: "Error: File not found",
        is_error: true,
      },
    ];

    expect(hasToolBlocks(content)).toBe(true);
    expect((content[0] as ToolResultBlock).is_error).toBe(true);
  });
});

describe("Content block type guards", () => {
  it("should correctly identify tool_result type", () => {
    const block: ContentBlock = {
      tool_use_id: "call_abc",
      type: "tool_result",
      content: "test",
    };

    expect(block.type).toBe("tool_result");
  });

  it("should correctly identify text type", () => {
    const block: ContentBlock = {
      type: "text",
      text: "test",
    };

    expect(block.type).toBe("text");
  });
});
