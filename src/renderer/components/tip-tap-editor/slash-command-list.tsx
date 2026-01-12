import type { Editor, Range } from "@tiptap/core";
import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  TextCursor,
} from "lucide-react";
import {
  forwardRef,
  type KeyboardEvent,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { cn } from "@/utils/tailwind";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (props: { editor: Editor; range: Range }) => void;
}

export const slashCommands: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Start writing with plain text",
    icon: TextCursor,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list",
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    description: "Create a task list with checkboxes",
    icon: CheckSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Add a blockquote",
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    description: "Add a code block",
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Add a horizontal divider",
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandList = forwardRef<
  SlashCommandListRef,
  SlashCommandListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((prev) => (prev + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  // Reset selection when items change (using items reference)
  const itemsKey = items.map((i) => i.title).join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally want to reset when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [itemsKey]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="z-50 min-w-[220px] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "text-popover-foreground hover:bg-accent/50"
            )}
            key={item.title}
            onClick={() => selectItem(index)}
            type="button"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground text-xs">
                {item.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";
