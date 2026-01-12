/**
 * Pragmatic tests for TipTapEditor component
 * Tests TipTap editor rendering and basic functionality
 */

import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TipTapEditor } from "@/renderer/components/tip-tap-editor";

describe("TipTapEditor", () => {
  it("should render the editor container", async () => {
    const { container } = render(<TipTapEditor content="" />);

    // Wait for editor to initialize
    await waitFor(() => {
      const editor =
        container.querySelector(".ProseMirror") ||
        container.querySelector("[contenteditable]");
      expect(editor).toBeTruthy();
    });
  });

  it("should apply custom className", async () => {
    const { container } = render(
      <TipTapEditor className="custom-class" content="" />
    );

    await waitFor(() => {
      const wrapper = container.querySelector(".custom-class");
      expect(wrapper).toBeInTheDocument();
    });
  });

  it("should have correct wrapper structure", async () => {
    const { container } = render(<TipTapEditor content="Test" />);

    await waitFor(() => {
      const wrapper = container.querySelector(".relative");
      expect(wrapper).toBeInTheDocument();
    });
  });

  it("should render actions when provided", async () => {
    const actions = <button type="button">Save Action</button>;
    const { container } = render(<TipTapEditor actions={actions} content="" />);

    await waitFor(() => {
      const buttons = container.querySelectorAll("button");
      const saveButton = Array.from(buttons).find(
        (b) => b.textContent === "Save Action"
      );
      expect(saveButton).toBeInTheDocument();
    });
  });

  it("should always render the raw mode toggle", async () => {
    const { container } = render(<TipTapEditor content="" />);

    await waitFor(() => {
      const buttons = container.querySelectorAll("button");
      // At least the raw mode toggle should be there
      expect(buttons.length).toBeGreaterThan(0);
      const svg =
        container.querySelector("svg.lucide-code") ||
        container.querySelector("svg.lucide-eye");
      expect(svg).toBeInTheDocument();
    });
  });

  it("should switch to raw mode editor when toggled", async () => {
    const { container } = render(<TipTapEditor content="Hello World" />);

    // Initially formatted view should be visible, raw view hidden
    await waitFor(() => {
      const editors = container.querySelectorAll(".ProseMirror");
      expect(editors.length).toBe(2); // Both editors exist
      // First one (formatted) visible, second (raw) hidden via class
      const wrappers = container.querySelectorAll(".flex-1");
      expect(wrappers[0]).not.toHaveClass("hidden");
    });

    // Find and click the toggle button (the one with the code icon)
    const toggleButton = container.querySelector(
      'button[data-slot="tooltip-trigger"]'
    ) as HTMLElement;
    expect(toggleButton).toBeInTheDocument();

    toggleButton.click();

    // Now raw mode should be visible with code block containing markdown
    await waitFor(() => {
      const codeBlock = container.querySelector("pre code.language-markdown");
      expect(codeBlock).toBeInTheDocument();
    });
  });

  it("should render without crashing when all props provided", () => {
    expect(() =>
      render(
        <TipTapEditor
          actions={<button type="button">Save</button>}
          className="test-class"
          content="Test content"
          editable={true}
          onChange={vi.fn()}
          placeholder="Write..."
        />
      )
    ).not.toThrow();
  });

  it("should be in a flex container", async () => {
    const { container } = render(<TipTapEditor content="Test" />);

    await waitFor(() => {
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("flex-col");
    });
  });

  it("should handle empty content without error", () => {
    expect(() => render(<TipTapEditor content="" />)).not.toThrow();
  });

  it("should handle undefined onChange", () => {
    expect(() =>
      render(<TipTapEditor content="Test" onChange={undefined} />)
    ).not.toThrow();
  });

  it("should handle markdown content", async () => {
    const markdownContent = "# Heading\n\n**Bold** text";
    const { container } = render(<TipTapEditor content={markdownContent} />);

    await waitFor(() => {
      const editor =
        container.querySelector(".ProseMirror") ||
        container.querySelector("[contenteditable]");
      expect(editor).toBeTruthy();
    });
  });

  it("should handle editable false", async () => {
    const { container } = render(
      <TipTapEditor content="Test" editable={false} />
    );

    await waitFor(() => {
      const editor =
        container.querySelector(".ProseMirror") ||
        container.querySelector("[contenteditable]");
      expect(editor).toBeTruthy();
    });
  });

  it("should handle re-render without crashing", () => {
    const { rerender } = render(<TipTapEditor content="Initial" />);

    expect(() => rerender(<TipTapEditor content="Updated" />)).not.toThrow();
  });
});
