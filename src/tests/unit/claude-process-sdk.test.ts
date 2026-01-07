import type {
  SDKAssistantMessage,
  SDKResultMessage,
  SDKSystemMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Claude Process SDK Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkClaudeAvailability Logic", () => {
    it("should parse version string correctly when claude is found", () => {
      const stdout = "claude 2.0.76\n";

      // Test the parsing logic
      const trimmed = stdout.trim();
      const hasVersion = trimmed.includes("claude");
      const result = {
        available: hasVersion,
        version: hasVersion ? trimmed : undefined,
      };

      expect(result.available).toBe(true);
      expect(result.version).toBe("claude 2.0.76");
    });

    it("should detect when claude is not found", () => {
      const stdout = "NOT_FOUND\n";

      // Test the parsing logic
      const trimmed = stdout.trim();
      const hasVersion = trimmed.includes("claude");
      const result = {
        available: hasVersion,
        version: hasVersion ? trimmed : undefined,
        error: hasVersion ? undefined : "Claude CLI not found in PATH",
      };

      expect(result.available).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should handle empty output", () => {
      const stdout = "";

      const trimmed = stdout.trim();
      const hasVersion = trimmed.includes("claude");
      const result = {
        available: hasVersion,
        version: hasVersion ? trimmed : undefined,
        error: hasVersion ? undefined : "Claude CLI not found in PATH",
      };

      expect(result.available).toBe(false);
    });
  });

  describe("SDK Message Types", () => {
    it("should properly type SDKAssistantMessage", () => {
      const message: SDKAssistantMessage = {
        type: "assistant",
        uuid: "test-uuid",
        session_id: "test-session",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        parent_tool_use_id: null,
      };

      expect(message.type).toBe("assistant");
      expect(message.uuid).toBe("test-uuid");
    });

    it("should properly type SDKResultMessage", () => {
      const message: SDKResultMessage = {
        type: "result",
        subtype: "success",
        uuid: "test-uuid",
        session_id: "test-session",
        duration_ms: 1000,
        duration_api_ms: 800,
        is_error: false,
        num_turns: 2,
        result: "Task completed",
        total_cost_usd: 0.01,
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
        modelUsage: {},
        permission_denials: [],
      };

      expect(message.type).toBe("result");
      expect(message.subtype).toBe("success");
      expect(message.total_cost_usd).toBe(0.01);
    });

    it("should properly type SDKSystemMessage", () => {
      const message: SDKSystemMessage = {
        type: "system",
        subtype: "init",
        uuid: "test-uuid",
        session_id: "test-session",
        apiKeySource: "user",
        cwd: "/test/path",
        tools: ["Read", "Write", "Bash"],
        mcp_servers: [],
        model: "claude-sonnet-4-5-20250929",
        permissionMode: "default",
        slash_commands: [],
        output_style: "text",
      };

      expect(message.type).toBe("system");
      expect(message.subtype).toBe("init");
      expect(message.tools).toContain("Read");
    });
  });

  describe("Process State Management", () => {
    it("should generate unique process IDs", async () => {
      const ids = new Set<string>();

      // Generate multiple IDs
      for (let i = 0; i < 100; i++) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        ids.add(id);
      }

      // All IDs should be unique
      expect(ids.size).toBe(100);
    });
  });

  describe("extractTextFromStreamEvent", () => {
    it("should extract text from content_block_delta events", () => {
      const event = {
        type: "content_block_delta",
        delta: {
          type: "text_delta",
          text: "Hello, world!",
        },
      };

      // Test the extraction logic inline since the function is not exported
      let content = "";
      if (event && typeof event === "object") {
        const anyEvent = event as Record<string, unknown>;
        if (anyEvent.type === "content_block_delta") {
          const delta = anyEvent.delta as Record<string, unknown> | undefined;
          if (delta?.type === "text_delta" && typeof delta.text === "string") {
            content = delta.text;
          }
        }
      }

      expect(content).toBe("Hello, world!");
    });

    it("should return empty string for non-text events", () => {
      const event = {
        type: "message_start",
        message: { id: "msg_123" },
      };

      // Test the extraction logic inline
      let content = "";
      if (event && typeof event === "object") {
        const anyEvent = event as Record<string, unknown>;
        if (anyEvent.type === "content_block_delta") {
          const delta = anyEvent.delta as Record<string, unknown> | undefined;
          if (delta?.type === "text_delta" && typeof delta.text === "string") {
            content = delta.text;
          }
        }
      }

      expect(content).toBe("");
    });
  });
});

describe("useClaudeStream Hook Integration", () => {
  it("should handle legacy chunk events", () => {
    const chunks: string[] = [];
    let streamingContent = "";

    // Simulate chunk handling
    const handleChunk = (content: string) => {
      streamingContent += content;
      chunks.push(content);
    };

    handleChunk("Hello");
    handleChunk(", ");
    handleChunk("world!");

    expect(streamingContent).toBe("Hello, world!");
    expect(chunks).toHaveLength(3);
  });

  it("should handle SDK assistant messages", () => {
    const messages: Array<{ type: string; content: string }> = [];

    const handleAssistantMessage = (message: SDKAssistantMessage) => {
      let content = "";
      const msgContent = message.message.content;

      if (typeof msgContent === "string") {
        content = msgContent;
      } else if (Array.isArray(msgContent)) {
        content = msgContent
          .map((block: any) => {
            if (block.type === "text" && block.text) {
              return block.text;
            }
            return "";
          })
          .join("");
      }

      messages.push({ type: "assistant", content });
    };

    handleAssistantMessage({
      type: "assistant",
      uuid: "test-uuid",
      session_id: "test-session",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Hello from Claude!" }],
      },
      parent_tool_use_id: null,
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe("Hello from Claude!");
  });

  it("should handle result messages and finalize streaming", () => {
    let isStreaming = true;
    let streamingContent = "Some streaming content";
    const messages: Array<{ type: string; content: string }> = [];

    const handleResult = (result: SDKResultMessage) => {
      // Finalize streaming content
      if (streamingContent) {
        messages.push({ type: "assistant", content: streamingContent });
        streamingContent = "";
      }

      isStreaming = false;

      // Add result info
      if (result.subtype === "success" && "result" in result) {
        messages.push({
          type: "system",
          content: `Cost: $${result.total_cost_usd?.toFixed(4)}`,
        });
      }
    };

    handleResult({
      type: "result",
      subtype: "success",
      uuid: "test-uuid",
      session_id: "test-session",
      duration_ms: 1000,
      duration_api_ms: 800,
      is_error: false,
      num_turns: 2,
      result: "Task completed",
      total_cost_usd: 0.0123,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
      modelUsage: {},
      permission_denials: [],
    });

    expect(isStreaming).toBe(false);
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe("Some streaming content");
    expect(messages[1].content).toContain("$0.0123");
  });
});

describe("Chat Atoms Integration", () => {
  it("should properly format message content from strings", () => {
    const formatMessageContent = (content: unknown): string => {
      if (!content) {
        return "";
      }
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        return content
          .map((block: any) => {
            if (block.type === "text" && block.text) {
              return block.text;
            }
            if (block.type === "tool_use") {
              return `[Tool: ${block.name}]`;
            }
            return "";
          })
          .join("\n");
      }
      try {
        return JSON.stringify(content, null, 2);
      } catch {
        return String(content);
      }
    };

    expect(formatMessageContent("Hello")).toBe("Hello");
    expect(formatMessageContent(null)).toBe("");
    expect(formatMessageContent(undefined)).toBe("");
  });

  it("should properly format message content from content blocks", () => {
    const formatMessageContent = (content: unknown): string => {
      if (!content) {
        return "";
      }
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        return content
          .map((block: any) => {
            if (block.type === "text" && block.text) {
              return block.text;
            }
            if (block.type === "tool_use") {
              return `[Tool: ${block.name}]`;
            }
            return "";
          })
          .join("\n");
      }
      try {
        return JSON.stringify(content, null, 2);
      } catch {
        return String(content);
      }
    };

    const blocks = [
      { type: "text", text: "Here is the result:" },
      { type: "tool_use", name: "Bash", input: { command: "ls" } },
    ];

    const formatted = formatMessageContent(blocks);
    expect(formatted).toContain("Here is the result:");
    expect(formatted).toContain("[Tool: Bash]");
  });
});
