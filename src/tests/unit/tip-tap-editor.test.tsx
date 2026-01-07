/**
 * Pragmatic tests for TipTapEditor component
 * Tests actual textarea rendering and user interactions
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TipTapEditor } from "@/renderer/components/tip-tap-editor";

describe("TipTapEditor", () => {
  it("should render textarea with content", () => {
    render(<TipTapEditor content="Hello world" />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Hello world");
  });

  it("should render with default placeholder", () => {
    render(<TipTapEditor content="" />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.placeholder).toBe("Write content here...");
  });

  it("should render with custom placeholder", () => {
    render(<TipTapEditor content="" placeholder="Enter markdown..." />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.placeholder).toBe("Enter markdown...");
  });

  it("should be editable by default", () => {
    render(<TipTapEditor content="Initial content" />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(false);
  });

  it("should be disabled when editable is false", () => {
    render(<TipTapEditor content="Content" editable={false} />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });

  it("should call onChange when content changes", () => {
    const handleChange = vi.fn();
    render(<TipTapEditor content="" onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "New content" } });

    expect(handleChange).toHaveBeenCalledWith("New content");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("should not call onChange when not provided", () => {
    expect(() => {
      render(<TipTapEditor content="Test" />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "New" } });
    }).not.toThrow();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <TipTapEditor className="custom-class" content="" />
    );

    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("should have correct structure", () => {
    const { container } = render(<TipTapEditor content="Test" />);

    const wrapper = container.querySelector(".relative");
    expect(wrapper).toBeInTheDocument();

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeInTheDocument();
  });

  it("should handle empty content", () => {
    render(<TipTapEditor content="" />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("");
  });

  it("should handle multiline content", () => {
    const multiline = "Line 1\nLine 2\nLine 3";
    render(<TipTapEditor content={multiline} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue(multiline);
  });

  it("should handle special characters", () => {
    const special = "Hello <world> & 'friends' \"quoted\"";
    render(<TipTapEditor content={special} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue(special);
  });

  it("should render actions when provided", () => {
    const actions = <button type="button">Save</button>;
    const { container } = render(<TipTapEditor actions={actions} content="" />);

    const button = container.querySelector("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Save");
  });

  it("should not render actions when not provided", () => {
    const { container } = render(<TipTapEditor content="" />);

    const button = container.querySelector("button");
    expect(button).toBeNull();
  });

  it("should have proper styling classes", () => {
    const { container } = render(<TipTapEditor content="Test" />);

    const textarea = container.querySelector("textarea");
    expect(textarea).toHaveClass("min-h-[200px]");
    expect(textarea).toHaveClass("flex-1");
    expect(textarea).toHaveClass("resize-none");
  });

  it("should have font-mono class", () => {
    const { container } = render(<TipTapEditor content="Test" />);

    const textarea = container.querySelector("textarea");
    expect(textarea).toHaveClass("font-mono");
  });

  it("should handle very long content", () => {
    const longContent = "a".repeat(10_000);
    render(<TipTapEditor content={longContent} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue(longContent);
  });

  it("should preserve value on re-render", () => {
    const { rerender } = render(<TipTapEditor content="Initial" />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Initial");

    rerender(<TipTapEditor content="Updated" />);
    expect(textarea).toHaveValue("Updated");
  });

  it("should handle rapid content changes", () => {
    const handleChange = vi.fn();
    render(<TipTapEditor content="" onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "A" } });
    fireEvent.change(textarea, { target: { value: "AB" } });
    fireEvent.change(textarea, { target: { value: "ABC" } });

    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith("ABC");
  });

  it("should call onChange with correct value on multiple changes", () => {
    const handleChange = vi.fn();
    render(<TipTapEditor content="" onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "First" } });
    expect(handleChange).toHaveBeenLastCalledWith("First");

    fireEvent.change(textarea, { target: { value: "Second" } });
    expect(handleChange).toHaveBeenLastCalledWith("Second");
  });

  it("should have border on wrapper", () => {
    const { container } = render(<TipTapEditor content="Test" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("border");
  });

  it("should have rounded corners", () => {
    const { container } = render(<TipTapEditor content="Test" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("rounded-md");
  });

  it("should be in a flex container", () => {
    const { container } = render(<TipTapEditor content="Test" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex");
    expect(wrapper).toHaveClass("flex-col");
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

  it("should handle onChange being undefined", () => {
    const { rerender } = render(
      <TipTapEditor content="Test" onChange={undefined} />
    );

    expect(() => rerender(<TipTapEditor content="Updated" />)).not.toThrow();
  });

  it("should preserve textarea styles", () => {
    const { container } = render(<TipTapEditor content="Test" />);

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.style.whiteSpace).toBe("pre-wrap");
    expect(textarea.style.wordBreak).toBe("break-word");
  });
});
