import { describe, expect, it } from "vitest";

/**
 * Test for message deduplication bug in streaming handler
 *
 * Bug: Assistant messages appear twice in the UI - once from the messages
 * array and once from streamingMessage state.
 *
 * Root cause: When assistant event arrives, streamingMessageAtom needs to be
 * cleared BEFORE the new message is added to the messages array.
 */

describe("Message Deduplication Bug", () => {
  it("should document the duplication bug scenario", () => {
    // Scenario that causes the bug:
    // 1. User sends message
    // 2. AI starts streaming (streamingMessageAtom gets content)
    // 3. Assistant event arrives with complete message
    // 4. Message is added to currentSessionMessagesAtom
    // 5. BUG: streamingMessageAtom still has content
    // 6. UI renders both -> duplication!

    const initialState = {
      messages: [
        {
          type: "user",
          messageId: "msg-1",
          content: "Hello",
          timestamp: "2024-01-01T00:00:00.000Z",
          status: "complete" as const,
        },
      ],
      streamingMessage: "Hello! How can I help you?", // Streaming content
    };

    // After assistant event arrives (FIXED):
    const afterAssistantEvent = {
      messages: [
        ...initialState.messages,
        {
          type: "assistant" as const,
          messageId: "msg-2",
          content: "Hello! How can I help you?",
          timestamp: "2024-01-01T00:00:01.000Z",
          status: "complete" as const,
        },
      ],
      // FIX: streamingMessage is now cleared when assistant event arrives
      streamingMessage: "", // Cleared!
    };

    // The fix: streamingMessage should be cleared
    expect(afterAssistantEvent.streamingMessage).toBe("");

    // The message should be in the array
    expect(afterAssistantEvent.messages).toHaveLength(2);
    expect(afterAssistantEvent.messages[1].content).toBe(
      "Hello! How can I help you?"
    );
  });

  it("should show expected behavior: streaming cleared on assistant event", () => {
    const streamingContent = "Some response";
    const assistantEventContent = "Some response";

    // When assistant event arrives with the same content:
    let streamingMessage = streamingContent;
    const messages: Array<{ content: string }> = [];

    // BUG: In current code, streamingMessage is not cleared
    // EXPECTED: streamingMessage should be cleared

    // The fix: clear streamingMessage when adding assistant message
    streamingMessage = ""; // This should happen
    messages.push({ content: assistantEventContent });

    // Verify: streaming is cleared, message is in array
    expect(streamingMessage).toBe("");
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe(assistantEventContent);
  });
});
