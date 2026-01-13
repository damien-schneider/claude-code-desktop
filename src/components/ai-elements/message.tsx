"use client";

import type { FileUIPart, UIMessage } from "ai";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactElement } from "react";
import { createContext, memo, useContext, useEffect, useState } from "react";
import type { StreamdownProps } from "streamdown";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/tailwind";
import { ToolCallDisplay, ToolResultDisplay } from "./tool-display";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
      "group-[.is-assistant]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = ComponentProps<"div">;

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={() => <>{button}</>} />
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null
);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error(
      "MessageBranch components must be used within MessageBranch"
    );
  }

  return context;
};

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = (newBranch: number) => {
    setCurrentBranch(newBranch);
    onBranchChange?.(newBranch);
  };

  const goToPrevious = () => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  };

  const goToNext = () => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  };

  const contextValue: MessageBranchContextType = {
    currentBranch,
    totalBranches: branches.length,
    goToPrevious,
    goToNext,
    branches,
    setBranches,
  };

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div
        className={cn("grid w-full gap-2 [&>div]:pb-0", className)}
        {...props}
      />
    </MessageBranchContext.Provider>
  );
};

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({
  children,
  ...props
}: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = Array.isArray(children) ? children : [children];

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden"
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

export type MessageBranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const MessageBranchSelector = ({
  className,
  from,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className="[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md"
      orientation="horizontal"
      {...props}
    />
  );
};

export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({
  children,
  ...props
}: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type MessageBranchNextProps = ComponentProps<typeof Button>;

export const MessageBranchNext = ({
  children,
  className,
  ...props
}: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({
  className,
  ...props
}: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn(
        "border-none bg-transparent text-muted-foreground shadow-none",
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

export type MessageResponseProps = ComponentProps<typeof Streamdown> & {
  contentBlocks?: ContentBlock[];
};

// ContentBlock types for structured content
type ContentBlock =
  | TextContentBlock
  | ImageContentBlock
  | ToolUseContentBlock
  | ToolResultContentBlock;

interface TextContentBlock {
  type: "text";
  text: string;
}

interface ImageContentBlock {
  type: "image";
  source?: {
    type: string;
    media_type?: string;
    data?: string;
  };
}

interface ToolUseContentBlock {
  type: "tool_use";
  id?: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResultContentBlock {
  type: "tool_result";
  tool_use_id?: string;
  content: string | unknown[];
  is_error?: boolean;
}

// Regex patterns for detecting tool blocks in markdown text
// These handle: ```tool_result\nContent```, ```tool_result Content```, etc.
// Using \s* to allow zero or more whitespace (including newlines)
const TOOL_USE_REGEX = /```tool_use\s*([\s\S]*?)```/g;
const TOOL_RESULT_REGEX = /```tool_result\s*([\s\S]*?)```/g;

// Regex for detecting unclosed tool blocks (streaming content)
const UNCLOSED_TOOL_RESULT_REGEX = /```tool_result\s*([\s\S]*)$/;
const UNCLOSED_TOOL_USE_REGEX = /```tool_use\s*([\s\S]*)$/;

/**
 * Checks if text contains tool blocks (closed or unclosed)
 */
function hasToolBlocksInText(text: string): boolean {
  // Check for closed blocks
  TOOL_USE_REGEX.lastIndex = 0;
  TOOL_RESULT_REGEX.lastIndex = 0;
  if (TOOL_USE_REGEX.test(text) || TOOL_RESULT_REGEX.test(text)) {
    TOOL_USE_REGEX.lastIndex = 0;
    TOOL_RESULT_REGEX.lastIndex = 0;
    return true;
  }

  // Check for unclosed blocks (streaming)
  if (
    UNCLOSED_TOOL_RESULT_REGEX.test(text) ||
    UNCLOSED_TOOL_USE_REGEX.test(text)
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts the text content from a React element's children
 * Handles various nested structures that Streamdown might produce
 */
function extractTextFromChildren(children: unknown): string {
  if (typeof children === "string") {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    const props = (children as { props?: { children?: unknown } }).props;
    if (props?.children) {
      return extractTextFromChildren(props.children);
    }
  }

  return "";
}

/**
 * Parses tool_use block content to extract tool name and input
 */
function parseToolUseContent(content: string): {
  toolName: string;
  input: Record<string, unknown>;
} {
  const lines = content.trim().split("\n");
  const toolName = lines[0]?.trim() || "tool";
  const jsonContent = lines.slice(1).join("\n").trim();

  let input: Record<string, unknown> = {};
  if (jsonContent) {
    try {
      input = JSON.parse(jsonContent);
    } catch {
      // If JSON parsing fails, treat as raw content
      input = { content: jsonContent };
    }
  }

  return { toolName, input };
}

/**
 * Custom Streamdown components for rendering tool-related code blocks
 */
const streamdownComponents: StreamdownProps["components"] = {
  pre: ({ children, className, ...props }) => {
    // Extract the code element's children to get the actual content
    const codeContent = extractTextFromChildren(children);

    // Check for tool_use or tool_result language hints in className
    // Streamdown adds language-{lang} class to code blocks
    const classStr = String(className || "");

    if (
      classStr.includes("language-tool_use") ||
      classStr.includes("tool_use")
    ) {
      const { toolName, input } = parseToolUseContent(codeContent);
      return <ToolCallDisplay input={input} toolName={toolName} />;
    }

    if (
      classStr.includes("language-tool_result") ||
      classStr.includes("tool_result")
    ) {
      return <ToolResultDisplay content={codeContent} />;
    }

    // Default rendering for other code blocks
    return (
      <pre className={className} {...props}>
        {children}
      </pre>
    );
  },
  code: ({ children, className, ...props }) => {
    // Handle inline code with tool markers
    const content = extractTextFromChildren(children);
    const classStr = String(className || "");

    if (
      classStr.includes("language-tool_use") ||
      classStr.includes("tool_use")
    ) {
      const { toolName, input } = parseToolUseContent(content);
      return <ToolCallDisplay input={input} toolName={toolName} />;
    }

    if (
      classStr.includes("language-tool_result") ||
      classStr.includes("tool_result")
    ) {
      return <ToolResultDisplay content={content} />;
    }

    // Default code rendering
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

/**
 * Processes text content to replace tool blocks with React components
 * This handles cases where tool blocks are embedded in text content
 * Also handles unclosed tool blocks (e.g., during streaming)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex text processing with tool block detection and streaming - refactoring would require extracting block parsing logic
function processTextWithToolBlocks(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Combined regex to find both tool_use and tool_result blocks (closed)
  // Match tool blocks with flexible whitespace/newline handling
  const combinedRegex = /```(tool_use|tool_result)\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null = combinedRegex.exec(text);

  while (match !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        result.push(textBefore);
      }
    }

    const blockType = match[1];
    const blockContent = match[2].trim();

    if (blockType === "tool_use") {
      const { toolName, input } = parseToolUseContent(blockContent);
      result.push(
        <ToolCallDisplay
          input={input}
          key={`tool-${key++}`}
          toolName={toolName}
        />
      );
    } else if (blockType === "tool_result") {
      result.push(
        <ToolResultDisplay content={blockContent} key={`result-${key++}`} />
      );
    }

    lastIndex = match.index + match[0].length;
    match = combinedRegex.exec(text);
  }

  // Handle remaining text - check for unclosed tool blocks
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);

    // Check for unclosed tool_result block (streaming)
    const unclosedResultMatch = UNCLOSED_TOOL_RESULT_REGEX.exec(remainingText);
    if (unclosedResultMatch) {
      const textBefore = remainingText.slice(0, unclosedResultMatch.index);
      if (textBefore.trim()) {
        result.push(textBefore);
      }
      const content = unclosedResultMatch[1].trim();
      result.push(
        <ToolResultDisplay
          content={content || "Loading..."}
          key={`result-${key++}`}
        />
      );
      return result.length > 0 ? result : [text];
    }

    // Check for unclosed tool_use block (streaming)
    const unclosedUseMatch = UNCLOSED_TOOL_USE_REGEX.exec(remainingText);
    if (unclosedUseMatch) {
      const textBefore = remainingText.slice(0, unclosedUseMatch.index);
      if (textBefore.trim()) {
        result.push(textBefore);
      }
      const content = unclosedUseMatch[1].trim();
      const { toolName, input } = parseToolUseContent(content);
      result.push(
        <ToolCallDisplay
          input={input}
          key={`tool-${key++}`}
          toolName={toolName || "Loading..."}
        />
      );
      return result.length > 0 ? result : [text];
    }

    // No unclosed blocks, just add remaining text
    if (remainingText.trim()) {
      result.push(remainingText);
    }
  }

  return result.length > 0 ? result : [text];
}

/**
 * MessageResponse component for rendering AI message content
 * Supports both structured content blocks and markdown text with embedded tool blocks
 */
export const MessageResponse = memo(
  ({ className, contentBlocks, children, ...props }: MessageResponseProps) => {
    // If we have structured content blocks, render them directly
    if (contentBlocks && Array.isArray(contentBlocks)) {
      return (
        <div className={cn("size-full", className)}>
          {contentBlocks.map((block, index) => {
            if (block.type === "text") {
              // Check if text contains tool blocks (closed or unclosed)
              const text = block.text;

              if (hasToolBlocksInText(text)) {
                const processedContent = processTextWithToolBlocks(text);
                return (
                  <div key={`text-${index}`}>
                    {processedContent.map((part, i) => {
                      if (typeof part === "string") {
                        return (
                          <Streamdown
                            cdnUrl={null}
                            className={cn(
                              "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            )}
                            components={streamdownComponents}
                            controls={{ code: false }}
                            key={`md-${index}-${i}`}
                            {...props}
                          >
                            {part}
                          </Streamdown>
                        );
                      }
                      return part;
                    })}
                  </div>
                );
              }

              // Normal text block - use Streamdown
              return (
                <Streamdown
                  cdnUrl={null}
                  className={cn("[&>*:first-child]:mt-0 [&>*:last-child]:mb-0")}
                  components={streamdownComponents}
                  controls={{ code: false }}
                  key={`text-${index}`}
                  {...props}
                >
                  {block.text}
                </Streamdown>
              );
            }

            if (block.type === "tool_use") {
              return (
                <ToolCallDisplay
                  input={block.input}
                  key={`tool-${block.id || index}`}
                  toolName={block.name}
                />
              );
            }

            if (block.type === "tool_result") {
              const content =
                typeof block.content === "string"
                  ? block.content
                  : block.content;
              return (
                <ToolResultDisplay
                  content={content as string}
                  isError={block.is_error}
                  key={`result-${block.tool_use_id || index}`}
                />
              );
            }

            return null;
          })}
        </div>
      );
    }

    // For markdown content passed as children
    const childrenString =
      typeof children === "string" ? children : String(children || "");

    if (hasToolBlocksInText(childrenString)) {
      const processedContent = processTextWithToolBlocks(childrenString);
      return (
        <div className={cn("size-full", className)}>
          {processedContent.map((part, i) => {
            if (typeof part === "string") {
              return (
                <Streamdown
                  cdnUrl={null}
                  className={cn("[&>*:first-child]:mt-0 [&>*:last-child]:mb-0")}
                  components={streamdownComponents}
                  controls={{ code: false }}
                  key={`md-${i}`}
                  {...props}
                >
                  {part}
                </Streamdown>
              );
            }
            return part;
          })}
        </div>
      );
    }

    // Default: render with Streamdown
    return (
      <Streamdown
        cdnUrl={null}
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          className
        )}
        components={streamdownComponents}
        controls={{ code: false }}
        {...props}
      >
        {children}
      </Streamdown>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.contentBlocks === nextProps.contentBlocks
);

MessageResponse.displayName = "MessageResponse";

export type MessageAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: FileUIPart;
  className?: string;
  onRemove?: () => void;
};

export function MessageAttachment({
  data,
  className,
  onRemove,
  ...props
}: MessageAttachmentProps) {
  const filename = data.filename || "";
  const mediaType =
    data.mediaType?.startsWith("image/") && data.url ? "image" : "file";
  const isImage = mediaType === "image";
  const attachmentLabel = filename || (isImage ? "Image" : "Attachment");

  return (
    <div
      className={cn(
        "group relative size-24 overflow-hidden rounded-lg",
        className
      )}
      {...props}
    >
      {isImage ? (
        <>
          <img
            alt={filename || "attachment"}
            className="size-full object-cover"
            height={100}
            src={data.url}
            width={100}
          />
          {onRemove && (
            <Button
              aria-label="Remove attachment"
              className="absolute top-2 right-2 size-6 rounded-full bg-background/80 p-0 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 [&>svg]:size-3"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              variant="ghost"
            >
              <XIcon />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger
              render={() => (
                <div className="flex size-full shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <PaperclipIcon className="size-4" />
                </div>
              )}
            />
            <TooltipContent>
              <p>{attachmentLabel}</p>
            </TooltipContent>
          </Tooltip>
          {onRemove && (
            <Button
              aria-label="Remove attachment"
              className="size-6 shrink-0 rounded-full p-0 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 [&>svg]:size-3"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              variant="ghost"
            >
              <XIcon />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export type MessageAttachmentsProps = ComponentProps<"div">;

export function MessageAttachments({
  children,
  className,
  ...props
}: MessageAttachmentsProps) {
  if (!children) {
    return null;
  }

  return (
    <div
      className={cn(
        "ml-auto flex w-fit flex-wrap items-start gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type MessageToolbarProps = ComponentProps<"div">;

export const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
