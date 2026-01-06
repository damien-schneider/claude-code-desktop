import { z } from "zod";

/**
 * Schema for content blocks in messages
 * Handles text, images, tool calls, and tool results
 */
const contentBlockSchema = z.object({
  type: z.enum(["text", "image", "tool_use", "tool_result"]),
  text: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  input: z.any().optional(),
  content: z.any().optional(),
  is_error: z.boolean().optional(),
});

/**
 * Schema for message content
 * Can be a string, array of content blocks, or nested object
 */
const messageContentSchema = z.union([
  z.string(),
  z.array(contentBlockSchema),
  z.object({
    role: z.string(),
    content: z.any(),
  }),
]);

/**
 * Schema for session summary (metadata only)
 */
export const sessionSummarySchema = z.object({
  sessionId: z.string(),
  projectPath: z.string(),
  projectName: z.string(),
  createdAt: z.string(),
  lastMessageAt: z.string(),
  messageCount: z.number(),
  gitBranch: z.string().optional(),
  previewMessage: z.string().optional(),
});

/**
 * Schema for a single message within a session
 */
export const sessionMessageSchema = z.object({
  type: z.enum(["user", "assistant", "system"]),
  messageId: z.string().optional(),
  timestamp: z.string(),
  content: messageContentSchema.optional(),
  message: z
    .object({
      role: z.string().optional(),
      content: messageContentSchema.optional(),
    })
    .optional(),
  toolCalls: z.array(z.any()).optional(),
  status: z.enum(["pending", "streaming", "complete", "error"]).optional(),
});

/**
 * Schema for full session details with all messages
 */
export const sessionDetailsSchema = sessionSummarySchema.extend({
  messages: z.array(sessionMessageSchema),
});

export type SessionSummary = z.infer<typeof sessionSummarySchema>;
export type SessionMessage = z.infer<typeof sessionMessageSchema>;
export type SessionDetails = z.infer<typeof sessionDetailsSchema>;
export type MessageContent = z.infer<typeof messageContentSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
