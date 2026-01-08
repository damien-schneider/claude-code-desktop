import { describe, expect, it } from "vitest";

const TOOL_RESULT_REGEX = /```tool_result\s?\n?([\s\S]*?)```/;

describe("DEBUG: tool_result matching", () => {
  it("should match the exact format from formatMessageContent", () => {
    // This is exactly what formatMessageContent creates
    const content = "Checked 1 file in 42ms. No fixes applied.";
    const markdown = `\`\`\`tool_result\n${content}\n\`\`\``;

    console.log("Markdown:", JSON.stringify(markdown));
    console.log("Regex:", TOOL_RESULT_REGEX.toString());

    const match = markdown.match(TOOL_RESULT_REGEX);
    console.log("Match:", match);

    expect(match).not.toBeNull();
    expect(match?.[1]?.trim()).toBe(content);
  });

  it("should handle content with backticks", () => {
    const content = "`Checked 1 file`";
    const markdown = `\`\`\`tool_result\n${content}\n\`\`\``;

    const match = markdown.match(TOOL_RESULT_REGEX);
    console.log("Match with backticks:", match);

    expect(match).not.toBeNull();
  });

  it("should debug actual text block content", () => {
    // Simulate what a text block might contain
    const textBlockText = "Some text\n```tool_result\nChecked 1 file\n```";

    console.log("Text block:", JSON.stringify(textBlockText));
    const match = textBlockText.match(TOOL_RESULT_REGEX);
    console.log("Text block match:", match);

    expect(match).not.toBeNull();
  });
});
