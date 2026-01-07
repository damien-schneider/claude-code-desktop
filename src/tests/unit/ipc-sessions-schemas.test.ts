/**
 * Pragmatic tests for IPC session schemas
 * Tests actual schema validation
 */
import { describe, expect, it } from "vitest";
import {
  type ContentBlock,
  type SessionDetails,
  type SessionMessage,
  type SessionSummary,
  sessionDetailsSchema,
  sessionMessageSchema,
  sessionSummarySchema,
} from "@/ipc/sessions/schemas";

describe("sessionSummarySchema", () => {
  const validSummary = {
    sessionId: "test-session-123",
    projectPath: "/path/to/project",
    projectName: "Test Project",
    createdAt: "2024-01-15T10:30:00Z",
    lastMessageAt: "2024-01-15T11:30:00Z",
    messageCount: 5,
  };

  it("should accept valid session summary", () => {
    const result = sessionSummarySchema.safeParse(validSummary);

    expect(result.success).toBe(true);
  });

  it("should accept session summary with optional fields", () => {
    const result = sessionSummarySchema.safeParse({
      ...validSummary,
      gitBranch: "main",
      previewMessage: "Hello world",
    });

    expect(result.success).toBe(true);
  });

  it("should require sessionId", () => {
    const result = sessionSummarySchema.safeParse({
      projectPath: "/path",
      projectName: "Test",
      createdAt: "2024-01-15T10:30:00Z",
      lastMessageAt: "2024-01-15T11:30:00Z",
      messageCount: 1,
    });

    expect(result.success).toBe(false);
  });

  it("should require projectPath", () => {
    const result = sessionSummarySchema.safeParse({
      sessionId: "test",
      projectName: "Test",
      createdAt: "2024-01-15T10:30:00Z",
      lastMessageAt: "2024-01-15T11:30:00Z",
      messageCount: 1,
    });

    expect(result.success).toBe(false);
  });

  it("should require projectName", () => {
    const result = sessionSummarySchema.safeParse({
      sessionId: "test",
      projectPath: "/path",
      createdAt: "2024-01-15T10:30:00Z",
      lastMessageAt: "2024-01-15T11:30:00Z",
      messageCount: 1,
    });

    expect(result.success).toBe(false);
  });

  it("should require messageCount to be a number", () => {
    const result = sessionSummarySchema.safeParse({
      ...validSummary,
      messageCount: "5" as any,
    });

    expect(result.success).toBe(false);
  });
});

describe("sessionMessageSchema", () => {
  const validMessage = {
    type: "user",
    timestamp: "2024-01-15T10:30:00Z",
  };

  it("should accept valid user message", () => {
    const result = sessionMessageSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  it("should accept valid assistant message", () => {
    const result = sessionMessageSchema.safeParse({
      type: "assistant",
      timestamp: "2024-01-15T10:30:00",
    });

    expect(result.success).toBe(true);
  });

  it("should accept valid system message", () => {
    const result = sessionMessageSchema.safeParse({
      type: "system",
      timestamp: "2024-01-15T10:30:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("should accept message with messageId", () => {
    const result = sessionMessageSchema.safeParse({
      ...validMessage,
      messageId: "msg-123",
    });

    expect(result.success).toBe(true);
  });

  it("should accept message with string content", () => {
    const result = sessionMessageSchema.safeParse({
      ...validMessage,
      content: "Hello world",
    });

    expect(result.success).toBe(true);
  });

  it("should accept message with array content blocks", () => {
    const result = sessionMessageSchema.safeParse({
      ...validMessage,
      content: [
        { type: "text", text: "Hello" },
        { type: "image", id: "img-1" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("should accept message with toolCalls", () => {
    const result = sessionMessageSchema.safeParse({
      ...validMessage,
      toolCalls: [{ id: "call-1", name: "test_tool", input: {} }],
    });

    expect(result.success).toBe(true);
  });

  it("should accept message with status", () => {
    const result = sessionMessageSchema.safeParse({
      ...validMessage,
      status: "complete",
    });

    expect(result.success).toBe(true);
  });

  it("should accept all status values", () => {
    const statuses = ["pending", "streaming", "complete", "error"] as const;

    statuses.forEach((status) => {
      const result = sessionMessageSchema.safeParse({
        ...validMessage,
        status,
      });
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid type", () => {
    const result = sessionMessageSchema.safeParse({
      type: "invalid",
      timestamp: "2024-01-15T10:30:00Z",
    });

    expect(result.success).toBe(false);
  });

  it("should require timestamp", () => {
    const result = sessionMessageSchema.safeParse({
      type: "user",
    });

    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = sessionMessageSchema.safeParse({
      ...validMessage,
      status: "invalid" as any,
    });

    expect(result.success).toBe(false);
  });
});

describe("sessionDetailsSchema", () => {
  const validSummary = {
    sessionId: "test-session-123",
    projectPath: "/path/to/project",
    projectName: "Test Project",
    createdAt: "2024-01-15T10:30:00Z",
    lastMessageAt: "2024-01-15T11:30:00Z",
    messageCount: 2,
  };

  it("should accept valid session details with messages", () => {
    const result = sessionDetailsSchema.safeParse({
      ...validSummary,
      messages: [
        {
          type: "user",
          timestamp: "2024-01-15T10:30:00Z",
          content: "Hello",
        },
        {
          type: "assistant",
          timestamp: "2024-01-15T10:31:00Z",
          content: "Hi there!",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("should accept session details with empty messages array", () => {
    const result = sessionDetailsSchema.safeParse({
      ...validSummary,
      messages: [],
    });

    expect(result.success).toBe(true);
  });

  it("should require messages array", () => {
    const result = sessionDetailsSchema.safeParse(validSummary);

    expect(result.success).toBe(false);
  });

  it("should validate messages in the array", () => {
    const result = sessionDetailsSchema.safeParse({
      ...validSummary,
      messages: [
        { type: "user", timestamp: "2024-01-15T10:30:00Z" },
        { type: "invalid", timestamp: "2024-01-15T10:31:00Z" } as any,
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("Content block types", () => {
  it("should accept text content block", () => {
    const contentBlock: ContentBlock = {
      type: "text",
      text: "Hello world",
    };

    const message = {
      type: "user" as const,
      timestamp: "2024-01-15T10:30:00Z",
      content: [contentBlock],
    };

    const result = sessionMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should accept image content block", () => {
    const contentBlock: ContentBlock = {
      type: "image",
      id: "img-123",
    };

    const message = {
      type: "user" as const,
      timestamp: "2024-01-15T10:30:00Z",
      content: [contentBlock],
    };

    const result = sessionMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should accept tool_use content block", () => {
    const contentBlock: ContentBlock = {
      type: "tool_use",
      id: "tool-123",
      name: "test_tool",
      input: { arg: "value" },
    };

    const message = {
      type: "assistant" as const,
      timestamp: "2024-01-15T10:30:00Z",
      content: [contentBlock],
    };

    const result = sessionMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should accept tool_result content block", () => {
    const contentBlock: ContentBlock = {
      type: "tool_result",
      content: "Tool output",
      is_error: false,
    };

    const message = {
      type: "assistant" as const,
      timestamp: "2024-01-15T10:30:00Z",
      content: [contentBlock],
    };

    const result = sessionMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should accept tool_result with error", () => {
    const contentBlock: ContentBlock = {
      type: "tool_result",
      content: "Error occurred",
      is_error: true,
    };

    const message = {
      type: "assistant" as const,
      timestamp: "2024-01-15T10:30:00Z",
      content: [contentBlock],
    };

    const result = sessionMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });
});

describe("Message content types", () => {
  it("should accept string content", () => {
    const message = {
      type: "user" as const,
      timestamp: "2024-01-15T10:30:00Z",
      content: "Simple string content",
    };

    const result = sessionMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should accept array of content blocks", () => {
    const message = {
      type: "user" as const,
      timestamp: "2024-01-15T10:30:00Z",
      content: [
        { type: "text" as const, text: "Hello" },
        { type: "text" as const, text: "World" },
      ],
    };

    const result = sessionMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should accept nested message object", () => {
    const message = {
      type: "user" as const,
      timestamp: "2024-01-15T10:30:00Z",
      message: {
        role: "assistant",
        content: "Nested content",
      },
    };

    const result = sessionMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });
});

describe("Type exports", () => {
  it("should export SessionSummary type", () => {
    const summary: SessionSummary = {
      sessionId: "test",
      projectPath: "/path",
      projectName: "Test",
      createdAt: "2024-01-15T10:30:00Z",
      lastMessageAt: "2024-01-15T11:30:00Z",
      messageCount: 1,
    };
    expect(summary.sessionId).toBe("test");
  });

  it("should export SessionMessage type", () => {
    const message: SessionMessage = {
      type: "user",
      timestamp: "2024-01-15T10:30:00Z",
    };
    expect(message.type).toBe("user");
  });

  it("should export SessionDetails type", () => {
    const details: SessionDetails = {
      sessionId: "test",
      projectPath: "/path",
      projectName: "Test",
      createdAt: "2024-01-15T10:30:00Z",
      lastMessageAt: "2024-01-15T11:30:00Z",
      messageCount: 1,
      messages: [],
    };
    expect(details.messages).toEqual([]);
  });
});
