import { ChatCircle } from "@phosphor-icons/react";
import { useAtomValue } from "jotai";
import type React from "react";
import { useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  currentSessionMessagesAtom,
  isStreamingAtom,
  isThinkingAtom,
  streamingMessageAtom,
} from "@/renderer/stores/chat-atoms";
import { MessageItem } from "./message-item";
import { ThinkingIndicator } from "./thinking-indicator";

export const MessageList: React.FC = () => {
  const messages = useAtomValue(currentSessionMessagesAtom);
  const isStreaming = useAtomValue(isStreamingAtom);
  const isThinking = useAtomValue(isThinkingAtom);
  const streamingMessage = useAtomValue(streamingMessageAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming
  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to scroll whenever these change, even if not used in the effect body
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingMessage, isThinking]);

  const filteredMessages = messages.filter((msg, index) => {
    const isSystem = msg.type === "system";
    if (isSystem && index > 0) {
      const prevMsg = messages[index - 1];
      if (
        prevMsg.type === "system" &&
        prevMsg.status === msg.status &&
        prevMsg.content === msg.content
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <Conversation className="flex-1">
      <ConversationContent>
        {messages.length === 0 && !isStreaming && !isThinking ? (
          <ConversationEmptyState
            description="View conversation history from your Claude Code sessions"
            icon={<ChatCircle className="h-16 w-16 opacity-20" />}
            title="No messages in this session"
          />
        ) : (
          <>
            {filteredMessages.map((msg, index) => (
              <MessageItem
                index={index}
                key={msg.messageId || index}
                msg={msg}
              />
            ))}

            {/* Thinking indicator - shows when Claude is processing */}
            {isThinking && !streamingMessage && (
              <Message from="assistant">
                <MessageContent>
                  <ThinkingIndicator />
                </MessageContent>
              </Message>
            )}

            {/* Streaming message - shows as text comes in */}
            {streamingMessage && (
              <Message from="assistant">
                <MessageContent>
                  <MessageResponse>{streamingMessage}</MessageResponse>
                </MessageContent>
              </Message>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </ConversationContent>
    </Conversation>
  );
};
