/**
 * Pragmatic tests for validation utilities
 * Tests actual validation functions from the codebase
 */
import { describe, expect, it } from "vitest";
import type {
  SessionMessage,
  SessionSummary,
} from "@/renderer/stores/chatAtoms";
import {
  isSessionMessage,
  isSessionSummary,
  safeParseSessionMessage,
  safeParseSessionMessages,
  safeParseSessionSummary,
  validateSessionMessage,
  validateSessionMessages,
  validateSessionSummary,
} from "@/renderer/stores/validation";

describe("Validation Utilities", () => {
  describe("validateSessionMessage", () => {
    it("should validate valid session message", () => {
      const validMessage: SessionMessage = {
        type: "user",
        messageId: "test-id",
        timestamp: "2024-01-15T10:30:00Z",
        content: [{ type: "text", text: "Hello" }],
      };

      const result = validateSessionMessage(validMessage);
      expect(result).toEqual(validMessage);
    });

    it("should throw for invalid message", () => {
      const invalidMessage = {
        messageId: "test-id",
        // Missing required fields
      };

      expect(() => validateSessionMessage(invalidMessage)).toThrow();
    });
  });

  describe("safeParseSessionMessage", () => {
    it("should return parsed message for valid data", () => {
      const validMessage: SessionMessage = {
        type: "user",
        messageId: "test-id",
        timestamp: "2024-01-15T10:30:00Z",
        content: [{ type: "text", text: "Hello" }],
      };

      const result = safeParseSessionMessage(validMessage);
      expect(result).toEqual(validMessage);
    });

    it("should return null for invalid data", () => {
      const invalidMessage = { invalid: "data" };

      const result = safeParseSessionMessage(invalidMessage);
      expect(result).toBeNull();
    });

    it("should return null for null/undefined", () => {
      expect(safeParseSessionMessage(null)).toBeNull();
      expect(safeParseSessionMessage(undefined)).toBeNull();
    });
  });

  describe("validateSessionSummary", () => {
    it("should validate valid session summary", () => {
      const validSummary: SessionSummary = {
        sessionId: "test-id",
        projectPath: "/test/project",
        projectName: "Test Project",
        createdAt: "2024-01-15T10:30:00Z",
        lastMessageAt: "2024-01-15T11:30:00Z",
        messageCount: 5,
      };

      const result = validateSessionSummary(validSummary);
      expect(result).toEqual(validSummary);
    });

    it("should throw for invalid summary", () => {
      const invalidSummary = {
        sessionId: "test-id",
        // Missing required fields
      };

      expect(() => validateSessionSummary(invalidSummary)).toThrow();
    });
  });

  describe("safeParseSessionSummary", () => {
    it("should return parsed summary for valid data", () => {
      const validSummary: SessionSummary = {
        sessionId: "test-id",
        projectPath: "/test/project",
        projectName: "Test Project",
        createdAt: "2024-01-15T10:30:00Z",
        lastMessageAt: "2024-01-15T11:30:00Z",
        messageCount: 5,
      };

      const result = safeParseSessionSummary(validSummary);
      expect(result).toEqual(validSummary);
    });

    it("should return null for invalid data", () => {
      const invalidSummary = { invalid: "data" };

      const result = safeParseSessionSummary(invalidSummary);
      expect(result).toBeNull();
    });

    it("should return null for null/undefined", () => {
      expect(safeParseSessionSummary(null)).toBeNull();
      expect(safeParseSessionSummary(undefined)).toBeNull();
    });
  });

  describe("validateSessionMessages", () => {
    it("should validate array of valid messages", () => {
      const validMessages: SessionMessage[] = [
        {
          type: "user",
          messageId: "1",
          timestamp: "2024-01-15T10:30:00Z",
          content: [{ type: "text", text: "Hello" }],
        },
        {
          type: "assistant",
          messageId: "2",
          timestamp: "2024-01-15T10:31:00Z",
          content: [{ type: "text", text: "Hi there!" }],
        },
      ];

      const result = validateSessionMessages(validMessages);
      expect(result).toHaveLength(2);
    });

    it("should throw if any message is invalid", () => {
      const mixedMessages = [
        {
          type: "user",
          messageId: "1",
          timestamp: "2024-01-15T10:30:00Z",
          content: [{ type: "text", text: "Hello" }],
        },
        { invalid: "data" },
      ] as unknown[];

      expect(() =>
        validateSessionMessages(mixedMessages as SessionMessage[])
      ).toThrow();
    });
  });

  describe("safeParseSessionMessages", () => {
    it("should filter out invalid messages", () => {
      const mixedData = [
        {
          type: "user",
          messageId: "1",
          timestamp: "2024-01-15T10:30:00Z",
          content: [{ type: "text", text: "Hello" }],
        },
        { invalid: "data" },
        {
          type: "assistant",
          messageId: "2",
          timestamp: "2024-01-15T10:31:00Z",
          content: [{ type: "text", text: "Hi!" }],
        },
      ];

      const result = safeParseSessionMessages(mixedData as unknown[]);
      expect(result).toHaveLength(2);
      expect(result[0].messageId).toBe("1");
      expect(result[1].messageId).toBe("2");
    });

    it("should return empty array for all invalid data", () => {
      const invalidData = [{ invalid: 1 }, { invalid: 2 }];

      const result = safeParseSessionMessages(invalidData as unknown[]);
      expect(result).toEqual([]);
    });

    it("should handle empty array", () => {
      const result = safeParseSessionMessages([]);
      expect(result).toEqual([]);
    });
  });

  describe("isSessionMessage", () => {
    it("should return true for valid message", () => {
      const validMessage: SessionMessage = {
        type: "user",
        messageId: "test-id",
        timestamp: "2024-01-15T10:30:00Z",
        content: [{ type: "text", text: "Hello" }],
      };

      expect(isSessionMessage(validMessage)).toBe(true);
    });

    it("should return false for invalid message", () => {
      const invalidMessage = { invalid: "data" };

      expect(isSessionMessage(invalidMessage)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isSessionMessage(null)).toBe(false);
      expect(isSessionMessage(undefined)).toBe(false);
    });

    it("should work as type guard", () => {
      const data: unknown = {
        type: "user",
        messageId: "test",
        timestamp: "2024-01-15T10:30:00Z",
        content: [],
      };

      if (isSessionMessage(data)) {
        // TypeScript should know this is a SessionMessage
        expect(data.type).toBeDefined();
      } else {
        expect(true).toBe(false); // Should not reach here
      }
    });
  });

  describe("isSessionSummary", () => {
    it("should return true for valid summary", () => {
      const validSummary: SessionSummary = {
        sessionId: "test-id",
        projectPath: "/test/project",
        projectName: "Test",
        createdAt: "2024-01-15T10:30:00Z",
        lastMessageAt: "2024-01-15T10:30:00Z",
        messageCount: 1,
      };

      expect(isSessionSummary(validSummary)).toBe(true);
    });

    it("should return false for invalid summary", () => {
      const invalidSummary = { invalid: "data" };

      expect(isSessionSummary(invalidSummary)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isSessionSummary(null)).toBe(false);
      expect(isSessionSummary(undefined)).toBe(false);
    });

    it("should work as type guard", () => {
      const data: unknown = {
        sessionId: "test",
        projectPath: "/test",
        projectName: "Test",
        createdAt: "2024-01-15T10:30:00Z",
        lastMessageAt: "2024-01-15T10:30:00Z",
        messageCount: 1,
      };

      if (isSessionSummary(data)) {
        // TypeScript should know this is a SessionSummary
        expect(data.projectName).toBeDefined();
      } else {
        expect(true).toBe(false); // Should not reach here
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle arrays with special content types", () => {
      const message: SessionMessage = {
        type: "user",
        messageId: "test",
        timestamp: "2024-01-15T10:30:00Z",
        content: [
          { type: "text", text: "Hello" },
          { type: "tool_use", id: "test-tool", name: "test", input: {} },
          { type: "tool_result", tool_use_id: "test-tool", content: "result" },
        ],
      };

      const result = safeParseSessionMessage(message);
      expect(result).not.toBeNull();
      if (result && Array.isArray(result.content)) {
        expect(result.content).toHaveLength(3);
      }
    });

    it("should handle message with status", () => {
      const message: SessionMessage = {
        type: "assistant",
        messageId: "test",
        timestamp: "2024-01-15T10:30:00Z",
        content: [{ type: "text", text: "Response" }],
        status: "complete",
      };

      const result = validateSessionMessage(message);
      expect(result.status).toBe("complete");
    });

    it("should handle message with toolCalls", () => {
      const message: SessionMessage = {
        type: "assistant",
        messageId: "test",
        timestamp: "2024-01-15T10:30:00Z",
        toolCalls: [
          {
            id: "call-1",
            name: "test_tool",
            input: { arg: "value" },
            result: "success",
          },
        ],
      };

      const result = safeParseSessionMessage(message);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls).toHaveLength(1);
      }
    });
  });
});
