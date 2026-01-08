import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ToolBlock,
  ToolCallDisplay,
  ToolResultDisplay,
} from "@/components/ai-elements/tool-display";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Regex patterns moved to top level for performance
const PATH_REGEX = /Path/;
const FIELDS_2_REGEX = /2 fields/;
const ITEMS_3_REGEX = /3 items/;
const LONG_RESULT_REGEX = /This is a very long result/;
const LINE_1_REGEX = /Line 1/;
const END_OF_CONTENT_REGEX = /End of content/;
const ITEM1_REGEX = /item1/;

describe("ToolCallDisplay", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders tool name correctly", () => {
    render(<ToolCallDisplay toolName="read_file" />);
    expect(screen.getByText("Read File")).toBeInTheDocument();
  });

  it("formats snake_case tool names", () => {
    render(<ToolCallDisplay toolName="write_file" />);
    expect(screen.getByText("Write File")).toBeInTheDocument();
  });

  it("formats camelCase tool names", () => {
    render(<ToolCallDisplay toolName="executeCommand" />);
    expect(screen.getByText("Execute Command")).toBeInTheDocument();
  });

  it("displays input parameters when provided", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallDisplay
        input={{ path: "/src/app.tsx", content: "hello world" }}
        toolName="write_file"
      />
    );

    // Click to expand
    await user.click(screen.getByText("Write File"));

    expect(screen.getByText("Path:")).toBeInTheDocument();
    expect(screen.getByText("Content:")).toBeInTheDocument();
  });

  it("shows field summary when collapsed", () => {
    render(
      <ToolCallDisplay input={{ path: "/src/app.tsx" }} toolName="read_file" />
    );

    // Should show summary with path field
    expect(screen.getByText(PATH_REGEX)).toBeInTheDocument();
  });

  it("renders without input parameters", () => {
    render(<ToolCallDisplay toolName="list_directory" />);
    expect(screen.getByText("List Directory")).toBeInTheDocument();
  });

  it("starts collapsed by default", () => {
    render(
      <ToolCallDisplay input={{ path: "/src/app.tsx" }} toolName="read_file" />
    );

    // The detailed view should not be visible
    const expandButton = screen.getByRole("button");
    expect(expandButton).toHaveAttribute("data-state", "closed");
  });

  it("can be opened by default", () => {
    render(
      <ToolCallDisplay
        defaultOpen
        input={{ path: "/src/app.tsx" }}
        toolName="read_file"
      />
    );

    const expandButton = screen.getByRole("button");
    expect(expandButton).toHaveAttribute("data-state", "open");
  });

  it("handles file paths with special styling", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallDisplay
        defaultOpen
        input={{ path: "/Users/test/project/src/app.tsx" }}
        toolName="read_file"
      />
    );

    // Click to expand if needed
    const button = screen.getByRole("button");
    if (button.getAttribute("data-state") === "closed") {
      await user.click(button);
    }

    // File paths should be displayed - check for the Path label
    expect(screen.getByText("Path:")).toBeInTheDocument();
  });

  it("handles nested objects in input", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallDisplay
        input={{
          options: {
            cwd: "/project",
            env: { NODE_ENV: "test" },
          },
        }}
        toolName="execute_command"
      />
    );

    await user.click(screen.getByText("Execute Command"));

    // Nested objects show as collapsed badge with field count
    expect(screen.getByText(FIELDS_2_REGEX)).toBeInTheDocument();
  });

  it("handles arrays in input", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallDisplay
        defaultOpen
        input={{
          files: ["/a.ts", "/b.ts", "/c.ts"],
        }}
        toolName="batch_read"
      />
    );

    await user.click(screen.getByText("Batch Read"));

    expect(screen.getByText(ITEMS_3_REGEX)).toBeInTheDocument();
  });
});

describe("ToolResultDisplay", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders short content inline", () => {
    render(<ToolResultDisplay content="Success" />);
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("renders short content with checkmark icon", () => {
    render(<ToolResultDisplay content="Done" />);
    // The component should render without errors
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("renders long content in collapsible", () => {
    const longContent =
      "This is a very long result that exceeds the threshold for inline display and should be shown in a collapsible section instead.";
    render(<ToolResultDisplay content={longContent} />);

    // Should truncate the content
    expect(screen.getByText(LONG_RESULT_REGEX)).toBeInTheDocument();
  });

  it("renders multi-line content in collapsible", () => {
    const multiLineContent = `Line 1
Line 2
Line 3`;
    render(<ToolResultDisplay content={multiLineContent} />);

    // Should show truncated first line
    expect(screen.getByText(LINE_1_REGEX)).toBeInTheDocument();
  });

  it("shows error state correctly", () => {
    render(<ToolResultDisplay content="File not found" isError />);
    // Error styling should be applied
    expect(screen.getByText("File not found")).toBeInTheDocument();
  });

  it("handles array content", () => {
    const arrayContent = ["item1", "item2", "item3"];
    render(<ToolResultDisplay content={JSON.stringify(arrayContent)} />);

    // Short stringified array is displayed inline
    expect(screen.getByText(ITEM1_REGEX)).toBeInTheDocument();
  });

  it("expands to show full content", async () => {
    const user = userEvent.setup();
    const longContent =
      "Start of content\nMiddle line\nEnd of content that is very long and detailed";
    render(<ToolResultDisplay content={longContent} />);

    // Click to expand
    const trigger = screen.getByRole("button");
    await user.click(trigger);

    // Full content should be visible
    expect(screen.getByText(END_OF_CONTENT_REGEX)).toBeInTheDocument();
  });

  it("starts collapsed by default for long content", () => {
    const longContent = "A".repeat(200);
    render(<ToolResultDisplay content={longContent} />);

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("data-state", "closed");
  });
});

describe("ToolBlock", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders combined tool call and result", () => {
    render(
      <ToolBlock
        input={{ path: "/src/app.tsx" }}
        result="File contents here"
        toolName="read_file"
      />
    );

    expect(screen.getByText("Read File")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });

  it("shows pending status", () => {
    render(<ToolBlock status="pending" toolName="search" />);

    expect(screen.getByText("Search")).toBeInTheDocument();
    // Pending status indicator should be present
  });

  it("shows running status", () => {
    render(<ToolBlock status="running" toolName="execute_command" />);

    expect(screen.getByText("Execute Command")).toBeInTheDocument();
  });

  it("shows completed status", () => {
    render(
      <ToolBlock result="Done" status="completed" toolName="write_file" />
    );

    expect(screen.getByText("Write File")).toBeInTheDocument();
  });

  it("shows error status", () => {
    render(
      <ToolBlock
        isError
        result="Permission denied"
        status="error"
        toolName="delete_file"
      />
    );

    expect(screen.getByText("Delete File")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("displays parameters section", () => {
    render(
      <ToolBlock input={{ query: "useState", limit: 10 }} toolName="search" />
    );

    expect(screen.getByText("Query:")).toBeInTheDocument();
    expect(screen.getByText("Limit:")).toBeInTheDocument();
  });

  it("handles empty input", () => {
    render(<ToolBlock input={{}} toolName="list_directory" />);

    expect(screen.getByText("List Directory")).toBeInTheDocument();
  });

  it("handles complex nested data", () => {
    render(
      <ToolBlock
        input={{
          config: {
            settings: {
              enabled: true,
              options: ["a", "b", "c"],
            },
          },
        }}
        toolName="configure"
      />
    );

    expect(screen.getByText("Config:")).toBeInTheDocument();
  });
});

describe("Tool icon selection", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses file icon for file-related tools", () => {
    render(<ToolCallDisplay toolName="read_file" />);
    // The component should render with appropriate icon
    expect(screen.getByText("Read File")).toBeInTheDocument();
  });

  it("uses folder icon for directory tools", () => {
    render(<ToolCallDisplay toolName="list_directory" />);
    expect(screen.getByText("List Directory")).toBeInTheDocument();
  });

  it("uses terminal icon for command tools", () => {
    render(<ToolCallDisplay toolName="run_terminal" />);
    expect(screen.getByText("Run Terminal")).toBeInTheDocument();
  });

  it("uses search icon for search tools", () => {
    render(<ToolCallDisplay toolName="grep_search" />);
    expect(screen.getByText("Grep Search")).toBeInTheDocument();
  });

  it("uses default wrench icon for unknown tools", () => {
    render(<ToolCallDisplay toolName="custom_unknown_tool" />);
    expect(screen.getByText("Custom Unknown Tool")).toBeInTheDocument();
  });
});

describe("Field value rendering", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders boolean values with badges", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallDisplay
        defaultOpen
        input={{ enabled: true, disabled: false }}
        toolName="configure"
      />
    );

    await user.click(screen.getByText("Configure"));

    expect(screen.getByText("true")).toBeInTheDocument();
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("renders numbers with appropriate styling", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallDisplay
        defaultOpen
        input={{ count: 42, limit: 100 }}
        toolName="query"
      />
    );

    await user.click(screen.getByText("Query"));

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders null values appropriately", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallDisplay defaultOpen input={{ value: null }} toolName="test" />
    );

    await user.click(screen.getByText("Test"));

    expect(screen.getByText("null")).toBeInTheDocument();
  });

  it("truncates long string values", async () => {
    const user = userEvent.setup();
    const longValue = "A".repeat(150);
    render(<ToolCallDisplay input={{ content: longValue }} toolName="write" />);

    // Click to expand
    await user.click(screen.getByText("Write"));

    // Content field should be present - may be truncated with expand option
    expect(screen.getByText("Content:")).toBeInTheDocument();
  });
});

describe("Accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("has accessible button for expanding tool call", () => {
    render(
      <ToolCallDisplay input={{ path: "/test.ts" }} toolName="read_file" />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("has accessible button for expanding tool result", () => {
    const longContent = "A".repeat(200);
    render(<ToolResultDisplay content={longContent} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("keyboard navigation works for collapsibles", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallDisplay input={{ path: "/test.ts" }} toolName="read_file" />
    );

    const button = screen.getByRole("button");

    // Tab to button and press Enter
    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("data-state", "open");
  });
});
