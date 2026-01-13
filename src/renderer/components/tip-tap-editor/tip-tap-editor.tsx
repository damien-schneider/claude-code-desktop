import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";
import { Code, Eye } from "lucide-react";
import type React from "react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/tailwind";
import { SlashCommand } from "./slash-command-extension";
import { slashCommandSuggestion } from "./slash-command-suggestion";

// Create lowlight instance with all languages for syntax highlighting
const lowlight = createLowlight(all);

export interface TipTapEditorRef {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
  clear: () => void;
  toggleRawMode: () => void;
  isRawMode: () => boolean;
}

interface TipTapEditorProps {
  content?: string;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  actions?: React.ReactNode;
  autofocus?: boolean;
  /** Show raw markdown source instead of formatted view */
  rawMode?: boolean;
  /** Callback when raw mode changes */
  onRawModeChange?: (rawMode: boolean) => void;
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  (
    {
      content = "",
      onChange,
      placeholder = "Type '/' for commands...",
      editable = true,
      className,
      actions,
      autofocus = false,
      rawMode: controlledRawMode,
      onRawModeChange,
    },
    ref
  ) => {
    // Support both controlled and uncontrolled raw mode
    const [internalRawMode, setInternalRawMode] = useState(false);
    const isRawMode = controlledRawMode ?? internalRawMode;

    const setRawMode = (value: boolean) => {
      setInternalRawMode(value);
      onRawModeChange?.(value);
    };

    // Track the current markdown content for syncing between editors
    const [markdownContent, setMarkdownContent] = useState(content);

    // Ref to track if we're updating internally to prevent sync loops
    const isInternalUpdate = useRef(false);
    // Ref to track the last synced content to avoid unnecessary updates
    const lastSyncedContent = useRef(content);

    // Main formatted editor (WYSIWYG view)
    const formattedEditor = useEditor({
      extensions: [
        StarterKit.configure({
          // Disable default codeBlock to use CodeBlockLowlight
          codeBlock: false,
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
          blockquote: {
            HTMLAttributes: {
              class: "border-l-4 border-border pl-4 italic",
            },
          },
          bulletList: {
            HTMLAttributes: {
              class: "list-disc pl-6",
            },
          },
          orderedList: {
            HTMLAttributes: {
              class: "list-decimal pl-6",
            },
          },
          horizontalRule: {
            HTMLAttributes: {
              class: "my-4 border-t border-border",
            },
          },
        }),
        CodeBlockLowlight.configure({
          lowlight,
          HTMLAttributes: {
            class: "rounded-md bg-muted p-4 font-mono text-sm",
          },
        }),
        TaskList.configure({
          HTMLAttributes: {
            class: "not-prose pl-2",
          },
        }),
        TaskItem.configure({
          nested: true,
          HTMLAttributes: {
            class: "flex items-start gap-2",
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass:
            "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
        }),
        Markdown,
        SlashCommand.configure({
          suggestion: slashCommandSuggestion,
        }),
      ],
      content,
      contentType: "markdown",
      editable,
      autofocus: autofocus && !isRawMode,
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm dark:prose-invert max-w-none",
            "min-h-[200px] flex-1 px-4 py-3",
            "focus:outline-none",
            "[&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:my-2",
            "[&_li]:my-1 [&_ol]:my-2 [&_ul]:my-2",
            "[&_blockquote]:my-3 [&_pre]:my-3",
            "[&_hr]:my-4",
            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
            "[&_.task-list-item]:flex [&_.task-list-item]:items-start [&_.task-list-item]:gap-2",
            "[&_.task-list-item_input]:mt-1",
            // Lowlight syntax highlighting styles
            "[&_.hljs-comment]:text-muted-foreground",
            "[&_.hljs-keyword]:text-purple-500 dark:[&_.hljs-keyword]:text-purple-400",
            "[&_.hljs-string]:text-green-600 dark:[&_.hljs-string]:text-green-400",
            "[&_.hljs-number]:text-orange-500 dark:[&_.hljs-number]:text-orange-400",
            "[&_.hljs-function]:text-blue-500 dark:[&_.hljs-function]:text-blue-400",
            "[&_.hljs-title]:text-blue-500 dark:[&_.hljs-title]:text-blue-400",
            "[&_.hljs-params]:text-foreground",
            "[&_.hljs-built_in]:text-cyan-500 dark:[&_.hljs-built_in]:text-cyan-400",
            "[&_.hljs-attr]:text-yellow-600 dark:[&_.hljs-attr]:text-yellow-400",
            "[&_.hljs-tag]:text-red-500 dark:[&_.hljs-tag]:text-red-400"
          ),
        },
      },
      onUpdate: ({ editor }) => {
        // Skip if this update was triggered by our own sync
        if (isInternalUpdate.current) {
          return;
        }
        // Use editor.getMarkdown() which is added by the Markdown extension
        const md = editor.getMarkdown();
        lastSyncedContent.current = md;
        setMarkdownContent(md);
        onChange?.(md);
      },
    });

    // Raw markdown editor (source view with syntax highlighting)
    const rawEditor = useEditor({
      extensions: [
        StarterKit.configure({
          // For raw mode, we want minimal formatting - just plain text with code block support
          codeBlock: false,
          heading: false,
          blockquote: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          horizontalRule: false,
          bold: false,
          italic: false,
          strike: false,
          code: false,
        }),
        CodeBlockLowlight.configure({
          lowlight,
          defaultLanguage: "markdown",
          HTMLAttributes: {
            class: "p-4 font-mono text-sm min-h-[200px] w-full",
          },
        }),
        Placeholder.configure({
          placeholder: "Raw markdown...",
          emptyEditorClass:
            "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
        }),
      ],
      // Wrap the content in a code block for syntax highlighting
      content: `<pre><code class="language-markdown">${escapeHtml(content)}</code></pre>`,
      editable,
      autofocus: autofocus && isRawMode,
      editorProps: {
        attributes: {
          class: cn(
            "min-h-[200px] flex-1 focus:outline-none",
            // Lowlight syntax highlighting for markdown
            "[&_.hljs-section]:font-bold [&_.hljs-section]:text-blue-500 dark:[&_.hljs-section]:text-blue-400",
            "[&_.hljs-bullet]:text-orange-500 dark:[&_.hljs-bullet]:text-orange-400",
            "[&_.hljs-emphasis]:text-foreground [&_.hljs-emphasis]:italic",
            "[&_.hljs-strong]:font-bold [&_.hljs-strong]:text-foreground",
            "[&_.hljs-link]:text-blue-500 dark:[&_.hljs-link]:text-blue-400",
            "[&_.hljs-code]:text-green-600 dark:[&_.hljs-code]:text-green-400",
            "[&_.hljs-quote]:text-muted-foreground [&_.hljs-quote]:italic"
          ),
        },
      },
      onUpdate: ({ editor }) => {
        // Skip if this update was triggered by our own sync
        if (isInternalUpdate.current) {
          return;
        }
        // Extract the raw text from the code block
        const rawText = editor.getText();
        lastSyncedContent.current = rawText;
        setMarkdownContent(rawText);
        onChange?.(rawText);
      },
    });

    // Sync content changes from parent (only when content prop actually changed from external source)
    useEffect(() => {
      // Skip if this is the same content we just synced
      if (content === lastSyncedContent.current) {
        return;
      }

      if (formattedEditor && content !== undefined) {
        isInternalUpdate.current = true;
        formattedEditor.commands.setContent(content, {
          contentType: "markdown",
        });
        isInternalUpdate.current = false;
      }

      if (rawEditor && content !== undefined) {
        isInternalUpdate.current = true;
        rawEditor.commands.setContent(
          `<pre><code class="language-markdown">${escapeHtml(content)}</code></pre>`
        );
        isInternalUpdate.current = false;
      }

      lastSyncedContent.current = content;
      setMarkdownContent(content);
    }, [formattedEditor, rawEditor, content]);

    // Sync editable state
    useEffect(() => {
      formattedEditor?.setEditable(editable);
      rawEditor?.setEditable(editable);
    }, [formattedEditor, rawEditor, editable]);

    // Track previous raw mode to detect actual mode changes
    const prevIsRawMode = useRef(isRawMode);

    // Sync content when switching between modes
    useEffect(() => {
      // Only sync when mode actually changes
      if (prevIsRawMode.current === isRawMode) {
        return;
      }
      prevIsRawMode.current = isRawMode;

      if (isRawMode && rawEditor && formattedEditor) {
        // Switching to raw mode - update raw editor with current markdown
        const md = formattedEditor.getMarkdown();
        isInternalUpdate.current = true;
        rawEditor.commands.setContent(
          `<pre><code class="language-markdown">${escapeHtml(md)}</code></pre>`
        );
        isInternalUpdate.current = false;
        rawEditor.commands.focus();
      } else if (!isRawMode && formattedEditor && rawEditor) {
        // Switching to formatted mode - update formatted editor with raw content
        const rawText = rawEditor.getText();
        isInternalUpdate.current = true;
        formattedEditor.commands.setContent(rawText, {
          contentType: "markdown",
        });
        isInternalUpdate.current = false;
        formattedEditor.commands.focus();
      }
    }, [isRawMode, formattedEditor, rawEditor]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        if (isRawMode && rawEditor) {
          return rawEditor.getText();
        }
        if (formattedEditor) {
          return formattedEditor.getMarkdown();
        }
        return markdownContent;
      },
      setMarkdown: (markdown: string) => {
        setMarkdownContent(markdown);
        if (formattedEditor) {
          formattedEditor.commands.setContent(markdown, {
            contentType: "markdown",
          });
        }
        if (rawEditor) {
          rawEditor.commands.setContent(
            `<pre><code class="language-markdown">${escapeHtml(markdown)}</code></pre>`
          );
        }
      },
      focus: () => {
        if (isRawMode) {
          rawEditor?.commands.focus();
        } else {
          formattedEditor?.commands.focus();
        }
      },
      clear: () => {
        setMarkdownContent("");
        formattedEditor?.commands.clearContent();
        rawEditor?.commands.setContent(
          '<pre><code class="language-markdown"></code></pre>'
        );
      },
      toggleRawMode: () => {
        setRawMode(!isRawMode);
      },
      isRawMode: () => isRawMode,
    }));

    if (!(formattedEditor && rawEditor)) {
      return null;
    }

    // Click handler to focus editor when clicking on container
    const handleContainerClick = (
      e: React.MouseEvent,
      editor: typeof formattedEditor | typeof rawEditor
    ) => {
      // Only focus if clicking on the container itself, not on editor content
      if (e.target === e.currentTarget) {
        editor?.commands.focus("end");
      }
    };

    return (
      <div className={cn("relative flex min-h-[200px] flex-col", className)}>
        {/* Formatted WYSIWYG view */}
        {/* biome-ignore lint/a11y/useSemanticElements: Using button element would interfere with TipTap editor internal focus management */}
        <div
          aria-label="Focus editor"
          className={cn(
            "min-h-[200px] flex-1 cursor-text",
            isRawMode && "hidden"
          )}
          onClick={(e) => handleContainerClick(e, formattedEditor)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              formattedEditor?.commands.focus("end");
            }
          }}
          role="button"
          tabIndex={0}
        >
          <EditorContent
            className="h-full min-h-[200px]"
            editor={formattedEditor}
          />
        </div>

        {/* Raw markdown view with syntax highlighting */}
        {/* biome-ignore lint/a11y/useSemanticElements: Using button element would interfere with TipTap editor internal focus management */}
        <div
          aria-label="Focus editor"
          className={cn(
            "min-h-[200px] flex-1 cursor-text",
            !isRawMode && "hidden"
          )}
          onClick={(e) => handleContainerClick(e, rawEditor)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              rawEditor?.commands.focus("end");
            }
          }}
          role="button"
          tabIndex={0}
        >
          <EditorContent className="h-full min-h-[200px]" editor={rawEditor} />
        </div>

        {/* Floating action buttons */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {actions}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setRawMode(!isRawMode)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  {isRawMode ? <Eye /> : <Code />}
                </Button>
              }
            />
            <TooltipContent side="left">
              {isRawMode ? "Show preview" : "Show markdown source"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }
);

TipTapEditor.displayName = "TipTapEditor";

// Helper function to escape HTML entities
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default TipTapEditor;
