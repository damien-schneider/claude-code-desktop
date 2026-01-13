import { CheckCircle, XCircle } from "@phosphor-icons/react";
import type React from "react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { ToolResultDisplay } from "@/components/ai-elements/tool-display";
import {
  formatMessageContent,
  type SessionMessage,
} from "@/renderer/stores/chat-atoms";
import { cn } from "@/utils/tailwind";

interface MessageItemProps {
  msg: SessionMessage;
  index: number;
}

export const MessageItem: React.FC<MessageItemProps> = ({ msg, index }) => {
  const isUser = msg.type === "user";
  const isSystem = msg.type === "system";
  const isError = msg.status === "error";

  // Content - check if it's an array (content blocks) or needs formatting
  const content = msg.content || msg.message?.content;
  const contentBlocks = Array.isArray(content) ? content : undefined;

  // Check if this is a user message that ONLY contains tool_result blocks
  const isToolResultOnly =
    isUser &&
    contentBlocks &&
    contentBlocks.length > 0 &&
    contentBlocks.every(
      (block: { type?: string }) => block.type === "tool_result"
    );

  // If it's only tool results, render them directly without Message wrapper
  if (isToolResultOnly) {
    return (
      <div className="flex flex-col gap-2" key={msg.messageId || index}>
        {contentBlocks.map(
          (
            block: {
              type: string;
              content?: string | unknown[];
              is_error?: boolean;
              tool_use_id?: string;
            },
            blockIndex: number
          ) => {
            const resultContent =
              typeof block.content === "string"
                ? block.content
                : JSON.stringify(block.content);
            return (
              <ToolResultDisplay
                content={resultContent}
                isError={block.is_error}
                key={block.tool_use_id || blockIndex}
              />
            );
          }
        )}
      </div>
    );
  }

  // Check if user message contains mixed tool blocks
  const hasToolBlocks = contentBlocks?.some(
    (block: { type?: string }) =>
      block.type === "tool_result" || block.type === "tool_use"
  );

  const contentString = contentBlocks
    ? undefined
    : formatMessageContent(content || "");

  // System messages (errors, info)
  if (isSystem) {
    return (
      <div
        className={cn(
          "mx-auto flex max-w-[90%] items-start gap-2 rounded-lg px-3 py-2 text-xs",
          isError
            ? "border border-destructive/20 bg-destructive/10 text-destructive"
            : "bg-muted/50 text-muted-foreground"
        )}
        key={msg.messageId || index}
      >
        {isError ? (
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <div className="px-4">
            <CheckCircle className="mx-auto size-4 shrink-0" />
          </div>
        )}
        {content && (
          <span className="wrap-break-word">
            {formatMessageContent(content || "")}
          </span>
        )}
      </div>
    );
  }

  return (
    <Message from={isUser ? "user" : "assistant"} key={msg.messageId || index}>
      <MessageContent>
        {isUser && !hasToolBlocks ? (
          formatMessageContent(content || "")
        ) : (
          <MessageResponse contentBlocks={contentBlocks}>
            {contentString}
          </MessageResponse>
        )}
      </MessageContent>
    </Message>
  );
};
