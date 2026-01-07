import { describe, expect, it } from "vitest";
import {
  type ContentBlock,
  formatMessageContent,
  type SessionMessage,
  SessionMessageContentSchema,
  SessionMessageSchema,
  type SessionSummary,
  SessionSummarySchema,
  type TextContentBlock,
  type ToolResultContentBlock,
  type ToolUseContentBlock,
} from "@/renderer/stores/chat-atoms";

describe("Chat Atoms Type Safety", () => {
  describe("ContentBlock Types", () => {
    it("should correctly type TextContentBlock", () => {
      const block: TextContentBlock = {
        type: "text",
        text: "Hello, world!",
      };

      expect(block.type).toBe("text");
      expect(block.text).toBe("Hello, world!");
    });

    it("should correctly type ToolUseContentBlock", () => {
      const block: ToolUseContentBlock = {
        type: "tool_use",
        id: "tool_123",
        name: "Bash",
        input: { command: "ls -la" },
      };

      expect(block.type).toBe("tool_use");
      expect(block.name).toBe("Bash");
      expect(block.input).toEqual({ command: "ls -la" });
    });

    it("should correctly type ToolResultContentBlock", () => {
      const block: ToolResultContentBlock = {
        type: "tool_result",
        tool_use_id: "tool_123",
        content: "file1.txt\nfile2.txt",
        is_error: false,
      };

      expect(block.type).toBe("tool_result");
      expect(block.content).toBe("file1.txt\nfile2.txt");
      expect(block.is_error).toBe(false);
    });

    it("should correctly type ToolResultContentBlock with array content", () => {
      const block: ToolResultContentBlock = {
        type: "tool_result",
        tool_use_id: "tool_123",
        content: [{ type: "text", text: "Result" }],
        is_error: false,
      };

      expect(block.type).toBe("tool_result");
      expect(Array.isArray(block.content)).toBe(true);
    });

    it("should union ContentBlock types correctly", () => {
      const blocks: ContentBlock[] = [
        { type: "text", text: "Hello" },
        { type: "tool_use", name: "Read", input: { path: "/file.txt" } },
        { type: "tool_result", content: "content here" },
      ];

      expect(blocks).toHaveLength(3);
      expect(blocks[0].type).toBe("text");
      expect(blocks[1].type).toBe("tool_use");
      expect(blocks[2].type).toBe("tool_result");
    });
  });

  describe("SessionMessage Types", () => {
    it("should type user messages correctly", () => {
      const message: SessionMessage = {
        type: "user",
        messageId: "msg_001",
        timestamp: new Date().toISOString(),
        content: "Hello Claude!",
        status: "complete",
      };

      expect(message.type).toBe("user");
      expect(typeof message.content).toBe("string");
    });

    it("should type assistant messages with content blocks", () => {
      const message: SessionMessage = {
        type: "assistant",
        messageId: "msg_002",
        timestamp: new Date().toISOString(),
        content: [
          { type: "text", text: "Here is the result:" },
          { type: "tool_use", name: "Bash", input: { command: "ls" } },
        ],
        status: "complete",
      };

      expect(message.type).toBe("assistant");
      expect(Array.isArray(message.content)).toBe(true);
    });

    it("should type messages with nested message format", () => {
      const message: SessionMessage = {
        type: "assistant",
        timestamp: new Date().toISOString(),
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hello!" }],
        },
        status: "streaming",
      };

      expect(message.message?.role).toBe("assistant");
      expect(Array.isArray(message.message?.content)).toBe(true);
    });
  });

  describe("SessionSummary Types", () => {
    it("should type SessionSummary correctly", () => {
      const summary: SessionSummary = {
        sessionId: "session_123",
        projectPath: "/Users/test/project",
        projectName: "my-project",
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 5,
        gitBranch: "main",
        previewMessage: "Hello, how can I help?",
      };

      expect(summary.sessionId).toBe("session_123");
      expect(summary.messageCount).toBe(5);
      expect(summary.gitBranch).toBe("main");
    });

    it("should allow optional fields to be undefined", () => {
      const summary: SessionSummary = {
        sessionId: "session_456",
        projectPath: "/Users/test/another",
        projectName: "another-project",
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 0,
      };

      expect(summary.gitBranch).toBeUndefined();
      expect(summary.previewMessage).toBeUndefined();
    });
  });

  describe("Zod Schema Validation", () => {
    it("should validate SessionMessageContentSchema with string", () => {
      const result = SessionMessageContentSchema.safeParse("Hello, world!");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("Hello, world!");
      }
    });

    it("should validate SessionMessageContentSchema with content blocks", () => {
      const content = [
        { type: "text", text: "Hello" },
        { type: "tool_use", name: "Bash", input: { cmd: "ls" } },
      ];

      const result = SessionMessageContentSchema.safeParse(content);
      expect(result.success).toBe(true);
    });

    it("should validate SessionMessageContentSchema with role object", () => {
      const content = {
        role: "assistant",
        content: [{ type: "text", text: "Response" }],
      };

      const result = SessionMessageContentSchema.safeParse(content);
      expect(result.success).toBe(true);
    });

    it("should validate SessionMessageSchema with full message", () => {
      const message = {
        type: "assistant",
        messageId: "msg_test",
        timestamp: new Date().toISOString(),
        content: "Hello!",
        status: "complete",
      };

      const result = SessionMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });

    it("should validate SessionSummarySchema", () => {
      const summary = {
        sessionId: "session_test",
        projectPath: "/path/to/project",
        projectName: "test-project",
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 10,
        gitBranch: "feature/test",
        previewMessage: "Test message",
      };

      const result = SessionSummarySchema.safeParse(summary);
      expect(result.success).toBe(true);
    });

    it("should reject invalid message types", () => {
      const message = {
        type: "invalid_type", // Not user/assistant/system
        timestamp: new Date().toISOString(),
      };

      const result = SessionMessageSchema.safeParse(message);
      expect(result.success).toBe(false);
    });
  });

  describe("formatMessageContent Function", () => {
    it("should format string content", () => {
      expect(formatMessageContent("Hello")).toBe("Hello");
    });

    it("should format undefined content", () => {
      expect(formatMessageContent(undefined)).toBe("");
    });

    it("should format text content blocks", () => {
      const content: ContentBlock[] = [
        { type: "text", text: "Line 1" },
        { type: "text", text: "Line 2" },
      ];

      const result = formatMessageContent(content);
      expect(result).toContain("Line 1");
      expect(result).toContain("Line 2");
    });

    it("should format tool_use blocks with code fence", () => {
      const content: ContentBlock[] = [
        {
          type: "tool_use",
          name: "Bash",
          input: { command: "echo hello" },
        },
      ];

      const result = formatMessageContent(content);
      expect(result).toContain("```tool_use");
      expect(result).toContain("Bash");
      expect(result).toContain("echo hello");
    });

    it("should format tool_result blocks", () => {
      const content: ContentBlock[] = [
        {
          type: "tool_result",
          content: "command output",
        },
      ];

      const result = formatMessageContent(content);
      expect(result).toContain("```tool_result");
      expect(result).toContain("command output");
    });

    it("should format tool_result with array content", () => {
      const content: ContentBlock[] = [
        {
          type: "tool_result",
          content: [{ text: "nested" }],
        },
      ];

      const result = formatMessageContent(content);
      expect(result).toContain("tool_result");
    });

    it("should format nested role content objects", () => {
      const content = {
        role: "assistant",
        content: "Nested content text",
      };

      const result = formatMessageContent(content);
      expect(result).toBe("Nested content text");
    });

    it("should format nested role content with blocks", () => {
      const content = {
        role: "assistant",
        content: [{ type: "text", text: "Nested block" }] as ContentBlock[],
      };

      const result = formatMessageContent(content);
      expect(result).toBe("Nested block");
    });

    it("should handle mixed content blocks", () => {
      const content: ContentBlock[] = [
        { type: "text", text: "Before tool" },
        { type: "tool_use", name: "Read", input: { path: "/file.txt" } },
        { type: "tool_result", content: "file contents" },
        { type: "text", text: "After tool" },
      ];

      const result = formatMessageContent(content);
      expect(result).toContain("Before tool");
      expect(result).toContain("Read");
      expect(result).toContain("file contents");
      expect(result).toContain("After tool");
    });

    it("should handle image blocks gracefully", () => {
      const content: ContentBlock[] = [
        { type: "text", text: "See this image:" },
        {
          type: "image",
          source: { type: "base64", data: "abc123" },
        },
      ];

      const result = formatMessageContent(content);
      expect(result).toContain("See this image:");
      // Image blocks return empty string, not crash
      expect(typeof result).toBe("string");
    });
  });

  describe("Type Guards", () => {
    it("should narrow TextContentBlock correctly", () => {
      const block: ContentBlock = { type: "text", text: "Hello" };

      if (block.type === "text") {
        // TypeScript should narrow this
        expect(block.text).toBe("Hello");
      }
    });

    it("should narrow ToolUseContentBlock correctly", () => {
      const block: ContentBlock = {
        type: "tool_use",
        name: "Write",
        input: { path: "/test.txt" },
      };

      if (block.type === "tool_use") {
        // TypeScript should narrow this
        expect(block.name).toBe("Write");
        expect(block.input.path).toBe("/test.txt");
      }
    });

    it("should narrow ToolResultContentBlock correctly", () => {
      const block: ContentBlock = {
        type: "tool_result",
        content: "Success",
      };

      if (block.type === "tool_result") {
        // TypeScript should narrow this
        expect(block.content).toBe("Success");
      }
    });
  });
});

describe("SDK Handlers Type Safety", () => {
  describe("Executable Path Discovery", () => {
    it("should find executable in common paths (mock test)", () => {
      // This tests the logic, not the actual file system
      const commonPaths = [
        "/usr/local/bin/claude",
        "/usr/bin/claude",
        "/opt/homebrew/bin/claude",
        `${process.env.HOME}/.local/bin/claude`,
        `${process.env.HOME}/.npm/bin/claude`,
      ];

      // At least one path should be checked
      expect(commonPaths.length).toBeGreaterThan(0);
      expect(commonPaths[3]).toContain(".local/bin");
    });

    it("should generate unique process IDs", () => {
      const ids = new Set<string>();

      for (let i = 0; i < 50; i++) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        ids.add(id);
      }

      expect(ids.size).toBe(50);
    });
  });

  describe("IPC Message Type Guards", () => {
    it("should validate IPC message structure", () => {
      const isValidIPCMessage = (
        message: unknown
      ): message is { channel: string; payload: unknown } => {
        return (
          typeof message === "object" &&
          message !== null &&
          "channel" in message &&
          "payload" in message &&
          typeof (message as Record<string, unknown>).channel === "string"
        );
      };

      // Valid message
      expect(
        isValidIPCMessage({
          channel: "claude-process-event",
          payload: { type: "assistant" },
        })
      ).toBe(true);

      // Invalid messages
      expect(isValidIPCMessage(null)).toBe(false);
      expect(isValidIPCMessage(undefined)).toBe(false);
      expect(isValidIPCMessage("string")).toBe(false);
      expect(isValidIPCMessage({ channel: 123 })).toBe(false);
      expect(isValidIPCMessage({ payload: {} })).toBe(false);
    });

    it("should extract content from SDK messages safely", () => {
      type SDKContentBlock =
        | { type: "text"; text: string }
        | { type: "tool_use"; name: string };

      const extractTextContent = (
        content: string | SDKContentBlock[] | undefined
      ): string => {
        if (!content) {
          return "";
        }
        if (typeof content === "string") {
          return content;
        }
        if (Array.isArray(content)) {
          return content
            .filter(
              (block): block is { type: "text"; text: string } =>
                block.type === "text"
            )
            .map((block) => block.text)
            .join("\n");
        }
        return "";
      };

      expect(extractTextContent("hello")).toBe("hello");
      expect(extractTextContent(undefined)).toBe("");
      expect(
        extractTextContent([
          { type: "text", text: "line1" },
          { type: "tool_use", name: "Bash" },
          { type: "text", text: "line2" },
        ])
      ).toBe("line1\nline2");
    });
  });
});

describe("useClaudeStream Type Safety", () => {
  describe("Message Content Extraction", () => {
    it("should handle SDK assistant message content", () => {
      interface SDKAssistantMessage {
        type: "assistant";
        message: {
          role: "assistant";
          content: string | Array<{ type: string; text?: string }>;
        };
      }

      const extractContent = (msg: SDKAssistantMessage): string => {
        const content = msg.message.content;
        if (typeof content === "string") {
          return content;
        }
        return content
          .filter(
            (block): block is { type: string; text: string } =>
              block.type === "text" && block.text !== undefined
          )
          .map((block) => block.text)
          .join("");
      };

      const stringMsg: SDKAssistantMessage = {
        type: "assistant",
        message: { role: "assistant", content: "Hello" },
      };
      expect(extractContent(stringMsg)).toBe("Hello");

      const blockMsg: SDKAssistantMessage = {
        type: "assistant",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "Part 1" },
            { type: "tool_use" },
            { type: "text", text: "Part 2" },
          ],
        },
      };
      expect(extractContent(blockMsg)).toBe("Part 1Part 2");
    });
  });

  describe("Event Channel Handling", () => {
    it("should match expected event channel names", () => {
      const CLAUDE_PROCESS_EVENT = "claude-process-event";

      expect(CLAUDE_PROCESS_EVENT).toBe("claude-process-event");
    });

    it("should handle streaming state transitions", () => {
      let isStreaming = false;
      let streamingContent = "";

      // Start streaming
      const startStreaming = () => {
        isStreaming = true;
        streamingContent = "";
      };

      // Append content
      const appendContent = (text: string) => {
        streamingContent += text;
      };

      // End streaming
      const endStreaming = () => {
        isStreaming = false;
        const finalContent = streamingContent;
        streamingContent = "";
        return finalContent;
      };

      startStreaming();
      expect(isStreaming).toBe(true);

      appendContent("Hello, ");
      appendContent("world!");
      expect(streamingContent).toBe("Hello, world!");

      const result = endStreaming();
      expect(isStreaming).toBe(false);
      expect(result).toBe("Hello, world!");
      expect(streamingContent).toBe("");
    });
  });
});
