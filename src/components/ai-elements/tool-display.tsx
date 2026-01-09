"use client";

import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  InfoIcon,
  SearchIcon,
  TerminalIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import {
  type ComponentProps,
  memo,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/tailwind";

// ============================================================================
// Types
// ============================================================================

interface ToolDisplayProps {
  toolName: string;
  input?: Record<string, unknown>;
  className?: string;
  defaultOpen?: boolean;
}

interface ToolResultDisplayProps {
  content: string | unknown[];
  isError?: boolean;
  className?: string;
  defaultOpen?: boolean;
}

interface JsonFieldProps {
  name: string;
  value: unknown;
  depth?: number;
  maxDepth?: number;
}

interface FieldSummaryProps {
  fields: Array<{ key: string; value: unknown }>;
  maxItems?: number;
}

// ============================================================================
// Constants
// ============================================================================

// Tool name to icon mapping for common tools
const TOOL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  read_file: FileTextIcon,
  write_file: FileIcon,
  edit_file: FileIcon,
  create_file: FileIcon,
  delete_file: FileIcon,
  list_directory: FolderIcon,
  list_dir: FolderIcon,
  search: SearchIcon,
  grep_search: SearchIcon,
  semantic_search: SearchIcon,
  run_terminal: TerminalIcon,
  run_command: TerminalIcon,
  execute_command: TerminalIcon,
  bash: TerminalIcon,
  web_search: GlobeIcon,
  fetch_url: GlobeIcon,
  code: CodeIcon,
};

// Common field labels for better display
const FIELD_LABELS: Record<string, string> = {
  path: "Path",
  filePath: "File Path",
  file_path: "File Path",
  content: "Content",
  command: "Command",
  query: "Query",
  pattern: "Pattern",
  directory: "Directory",
  dir: "Directory",
  url: "URL",
  message: "Message",
  name: "Name",
  type: "Type",
  language: "Language",
  line: "Line",
  startLine: "Start Line",
  endLine: "End Line",
  limit: "Limit",
  offset: "Offset",
};

// ============================================================================
// Utility Functions
// ============================================================================

function getToolIcon(
  toolName: string
): React.ComponentType<{ className?: string }> {
  // Check for exact match
  if (TOOL_ICONS[toolName]) {
    return TOOL_ICONS[toolName];
  }

  // Check for partial match
  const lowerName = toolName.toLowerCase();
  for (const [key, Icon] of Object.entries(TOOL_ICONS)) {
    if (lowerName.includes(key)) {
      return Icon;
    }
  }

  return WrenchIcon;
}

function formatToolName(toolName: string): string {
  return toolName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFieldName(fieldName: string): string {
  return (
    FIELD_LABELS[fieldName] ||
    fieldName
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function isLongValue(value: unknown): boolean {
  if (typeof value === "string") {
    return value.length > 100 || value.includes("\n");
  }
  if (Array.isArray(value)) {
    return value.length > 5;
  }
  if (typeof value === "object" && value !== null) {
    return Object.keys(value).length > 3;
  }
  return false;
}

function truncateValue(value: string, maxLength = 80): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}…`;
}

function getValuePreview(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    const firstLine = value.split("\n")[0];
    return truncateValue(firstLine, 60);
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `{${keys.length} fields}`;
  }
  return String(value);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

// Regex for file path detection - moved to top level for performance
const FILE_PATH_REGEX = /^[a-zA-Z]:\\/;

// ============================================================================
// Sub-components
// ============================================================================

// Renders null/undefined values
const NullValue = ({ value }: { value: null | undefined }) => (
  <span className="text-muted-foreground italic">
    {value === null ? "null" : "undefined"}
  </span>
);

// Renders boolean values
const BooleanValue = ({ value }: { value: boolean }) => (
  <Badge className="text-xs" variant={value ? "default" : "secondary"}>
    {value ? "true" : "false"}
  </Badge>
);

// Renders number values
const NumberValue = ({ value }: { value: number }) => (
  <span className="font-mono text-blue-600">{value}</span>
);

// Renders file path values
const FilePathValue = ({ value }: { value: string }) => (
  <span className="flex items-center gap-1 font-mono text-xs">
    <FileIcon className="size-3 text-muted-foreground" />
    <span className="truncate text-emerald-600" title={value}>
      {value}
    </span>
  </span>
);

// Renders expanded multi-line string
const MultiLineValue = ({ value }: { value: string }) => (
  <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted/50 p-2 text-xs">
    <code>{value}</code>
  </pre>
);

// Renders array badge when collapsed
const ArrayBadge = ({ length }: { length: number }) => (
  <Badge className="text-xs" variant="outline">
    {length} items
  </Badge>
);

// Renders object badge when collapsed
const ObjectBadge = ({ fieldCount }: { fieldCount: number }) => (
  <Badge className="text-xs" variant="outline">
    {fieldCount} fields
  </Badge>
);

// ============================================================================
// Complex Value Renderers (extracted to reduce complexity)
// ============================================================================

interface StringValueProps {
  value: string;
  isExpanded: boolean;
}

// Renders string values with special handling for file paths and multiline
const StringValue = ({ value, isExpanded }: StringValueProps) => {
  const isFilePath = value.startsWith("/") || FILE_PATH_REGEX.test(value);

  if (isFilePath) {
    return <FilePathValue value={value} />;
  }

  if (value.includes("\n") && isExpanded) {
    return <MultiLineValue value={value} />;
  }

  return (
    <span className="font-mono text-foreground text-xs">
      {truncateValue(value, isExpanded ? 500 : 80)}
    </span>
  );
};

interface ArrayValueProps {
  value: JsonValue[];
  isExpanded: boolean;
  depth: number;
  maxDepth: number;
}

// Renders array values with expansion logic
const ArrayValue = ({
  value,
  isExpanded,
  depth,
  maxDepth,
}: ArrayValueProps) => {
  if (!isExpanded) {
    return <ArrayBadge length={value.length} />;
  }

  return (
    <div className="mt-1 space-y-1 border-muted border-l-2 pl-2">
      {value.slice(0, 10).map((item, index) => (
        <JsonField
          depth={depth + 1}
          key={index}
          maxDepth={maxDepth}
          name={`[${index}]`}
          value={item}
        />
      ))}
      {value.length > 10 && (
        <span className="text-muted-foreground text-xs">
          ... and {value.length - 10} more
        </span>
      )}
    </div>
  );
};

interface ObjectValueProps {
  value: Record<string, JsonValue>;
  isExpanded: boolean;
  depth: number;
  maxDepth: number;
}

// Renders object values with expansion logic
const ObjectValue = ({
  value,
  isExpanded,
  depth,
  maxDepth,
}: ObjectValueProps) => {
  if (!isExpanded) {
    return <ObjectBadge fieldCount={Object.keys(value).length} />;
  }

  return (
    <div className="mt-1 space-y-1 border-muted border-l-2 pl-2">
      {Object.entries(value).map(([key, val]) => (
        <JsonField
          depth={depth + 1}
          key={key}
          maxDepth={maxDepth}
          name={key}
          value={val}
        />
      ))}
    </div>
  );
};

/**
 * Displays a single JSON field with appropriate formatting
 */
const JsonField = memo(
  ({ name, value, depth = 0, maxDepth = 3 }: JsonFieldProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isExpandable = isLongValue(value) && depth < maxDepth;
    const preview = getValuePreview(value);

    const renderValue = useCallback((): React.ReactNode => {
      // Primitives: null/undefined, boolean, number
      if (value === null || value === undefined) {
        return <NullValue value={value} />;
      }
      if (typeof value === "boolean") {
        return <BooleanValue value={value} />;
      }
      if (typeof value === "number") {
        return <NumberValue value={value} />;
      }

      // String with special handling
      if (typeof value === "string") {
        return <StringValue isExpanded={isExpanded} value={value} />;
      }

      // Array with expansion
      if (Array.isArray(value)) {
        return (
          <ArrayValue
            depth={depth}
            isExpanded={isExpanded}
            maxDepth={maxDepth}
            value={value}
          />
        );
      }

      // Object with expansion
      if (typeof value === "object") {
        return (
          <ObjectValue
            depth={depth}
            isExpanded={isExpanded}
            maxDepth={maxDepth}
            value={value as Record<string, JsonValue>}
          />
        );
      }

      // Fallback
      return <span className="text-xs">{preview}</span>;
    }, [value, isExpanded, depth, maxDepth, preview]);

    return (
      <div className="flex flex-wrap items-start gap-1">
        {isExpandable ? (
          <Button
            className="h-auto shrink-0 gap-1 p-0 font-medium text-muted-foreground text-xs hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            variant="ghost"
          >
            <ChevronRightIcon
              className={cn(
                "size-3 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
            {formatFieldName(name)}:
          </Button>
        ) : (
          <span className="shrink-0 font-medium text-muted-foreground text-xs">
            {formatFieldName(name)}:
          </span>
        )}
        <div className="min-w-0 flex-1">{renderValue()}</div>
      </div>
    );
  }
);

JsonField.displayName = "JsonField";

/**
 * Quick summary view showing key fields at a glance
 */
const FieldSummary = memo(({ fields, maxItems = 3 }: FieldSummaryProps) => {
  const displayFields = fields.slice(0, maxItems);
  const remaining = fields.length - maxItems;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {displayFields.map(({ key, value }) => {
        const preview = getValuePreview(value);
        return (
          <span className="text-xs" key={key}>
            <span className="text-muted-foreground">
              {formatFieldName(key)}
            </span>
            :{" "}
            <span className="font-mono text-foreground">
              {truncateValue(preview, 30)}
            </span>
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="text-muted-foreground text-xs">+{remaining} more</span>
      )}
    </div>
  );
});

FieldSummary.displayName = "FieldSummary";

// ============================================================================
// Main Components
// ============================================================================

/**
 * Displays a tool call with its input parameters in a collapsible format.
 * Shows a quick summary when collapsed and full details when expanded.
 */
export const ToolCallDisplay = memo(
  ({ toolName, input, className, defaultOpen = false }: ToolDisplayProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const Icon = getToolIcon(toolName);
    const formattedName = formatToolName(toolName);

    const fields = useMemo(() => {
      if (!input || typeof input !== "object") {
        return [];
      }
      return Object.entries(input).map(([key, value]) => ({ key, value }));
    }, [input]);

    // Prioritize important fields for the summary
    const priorityFields = useMemo(() => {
      const priority = ["path", "filePath", "file_path", "command", "query"];
      const sorted = [...fields].sort((a, b) => {
        const aIdx = priority.indexOf(a.key);
        const bIdx = priority.indexOf(b.key);
        if (aIdx === -1 && bIdx === -1) {
          return 0;
        }
        if (aIdx === -1) {
          return 1;
        }
        if (bIdx === -1) {
          return -1;
        }
        return aIdx - bIdx;
      });
      return sorted;
    }, [fields]);

    return (
      <Collapsible
        className={cn("my-2 w-fit min-w-0 max-w-full", className)}
        onOpenChange={setIsOpen}
        open={isOpen}
      >
        <CollapsibleTrigger className="group flex w-full items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/50">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{formattedName}</span>
              <ChevronRightIcon
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-90"
                )}
              />
            </div>
            {!isOpen && fields.length > 0 && (
              <div className="mt-1">
                <FieldSummary fields={priorityFields} maxItems={2} />
              </div>
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 rounded-b-md border border-t-0 bg-background p-3">
            {fields.length > 0 ? (
              fields.map(({ key, value }) => (
                <JsonField key={key} name={key} value={value} />
              ))
            ) : (
              <span className="text-muted-foreground text-xs italic">
                No parameters
              </span>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

ToolCallDisplay.displayName = "ToolCallDisplay";

/**
 * Displays a tool result in a compact or expanded format.
 * For short results, shows inline. For longer results, shows collapsible.
 */
export const ToolResultDisplay = memo(
  ({
    content,
    isError = false,
    className,
    defaultOpen = false,
  }: ToolResultDisplayProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [copied, setCopied] = useState(false);

    const stringContent = useMemo(() => {
      if (typeof content === "string") {
        return content;
      }
      return JSON.stringify(content, null, 2);
    }, [content]);

    const isShort = stringContent.length <= 80 && !stringContent.includes("\n");
    const Icon = isError ? XCircleIcon : CheckCircleIcon;
    const iconColor = isError ? "text-destructive" : "text-emerald-500";

    const handleCopy = useCallback(() => {
      copyToClipboard(stringContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, [stringContent]);

    // Compute the display text for the trigger
    const triggerText = useMemo(() => {
      if (!isOpen) {
        return truncateValue(stringContent.split("\n")[0], 60);
      }
      return isError ? "Error result" : "Result";
    }, [isOpen, isError, stringContent]);

    // Short inline result
    if (isShort) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={() => (
                <div
                  className={cn(
                    "my-1 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px]",
                    isError
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "bg-muted/30 text-muted-foreground",
                    className
                  )}
                >
                  <Icon className={cn("size-3", iconColor)} />
                  <span className="font-mono">{stringContent}</span>
                </div>
              )}
            />
            <TooltipContent>
              <p>Click to copy</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Collapsible longer result
    return (
      <Collapsible
        className={cn("my-2 w-fit min-w-0 max-w-full", className)}
        onOpenChange={setIsOpen}
        open={isOpen}
      >
        <CollapsibleTrigger
          className={cn(
            "group flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] transition-colors",
            isError
              ? "border-destructive/30 bg-destructive/10 hover:bg-destructive/20"
              : "bg-muted/30 hover:bg-muted/50"
          )}
        >
          <Icon className={cn("size-3", iconColor)} />
          <span
            className={cn(
              "font-mono",
              isError ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {triggerText}
          </span>
          <ChevronRightIcon
            className={cn(
              "size-3 text-muted-foreground transition-transform",
              isOpen && "rotate-90"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className={cn(
              "relative rounded-b border border-t-0 p-2",
              isError ? "bg-destructive/5" : "bg-muted/20"
            )}
          >
            <pre
              className={cn(
                "max-h-64 overflow-auto text-[10px]",
                isError ? "text-destructive" : "text-foreground"
              )}
            >
              <code>{stringContent}</code>
            </pre>
            <Button
              className="absolute top-2 right-2 size-6"
              onClick={handleCopy}
              size="icon"
              type="button"
              variant="ghost"
            >
              {copied ? (
                <CheckCircleIcon className="size-3 text-emerald-500" />
              ) : (
                <ClipboardIcon className="size-3" />
              )}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

ToolResultDisplay.displayName = "ToolResultDisplay";

/**
 * Combined display for a tool call and its result
 */
export interface ToolBlockProps extends ComponentProps<"div"> {
  toolName: string;
  input?: Record<string, unknown>;
  result?: string | unknown[];
  isError?: boolean;
  status?: "pending" | "running" | "completed" | "error";
}

export const ToolBlock = memo(
  ({
    toolName,
    input,
    result,
    isError,
    status = "completed",
    className,
    ...props
  }: ToolBlockProps) => {
    const Icon = getToolIcon(toolName);
    const formattedName = formatToolName(toolName);

    const statusIcon: ReactNode = useMemo(() => {
      switch (status) {
        case "pending":
          return <InfoIcon className="size-3 animate-pulse text-blue-500" />;
        case "running":
          return (
            <div className="size-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          );
        case "error":
          return <XCircleIcon className="size-3 text-destructive" />;
        default:
          return <CheckCircleIcon className="size-3 text-emerald-500" />;
      }
    }, [status]);

    return (
      <div
        className={cn(
          "my-2 overflow-hidden rounded-md border bg-muted/20",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
          <Icon className="size-4 text-muted-foreground" />
          <span className="flex-1 font-medium text-sm">{formattedName}</span>
          {statusIcon}
        </div>

        {input && Object.keys(input).length > 0 && (
          <div className="space-y-1 border-b p-3">
            {Object.entries(input).map(([key, value]) => (
              <JsonField key={key} name={key} value={value} />
            ))}
          </div>
        )}

        {result !== undefined && (
          <div className="p-3">
            <div className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {isError ? "Error" : "Result"}
            </div>
            <ToolResultDisplay content={result} isError={isError} />
          </div>
        )}
      </div>
    );
  }
);

ToolBlock.displayName = "ToolBlock";
