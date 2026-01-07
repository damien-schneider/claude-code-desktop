/**
 * Pragmatic tests for ModeToggle component
 * Tests actual rendering and mode switching behavior
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModeToggle } from "@/renderer/components/mode-toggle";

// Mock jotai
vi.mock("jotai", () => ({
  useAtom: vi.fn(),
  useSetAtom: vi.fn(),
  atom: vi.fn(),
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({ onClick, children, variant, className }: any) => (
    <button
      className={className}
      data-variant={variant}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  ),
}));

import { useAtom, useSetAtom } from "jotai";

describe("ModeToggle", () => {
  const mockSetAppMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSetAtom as any).mockReturnValue(mockSetAppMode);
    (useAtom as any).mockReturnValue(["settings", mockSetAppMode]);
  });

  it("should render settings and chat buttons", () => {
    render(<ModeToggle />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
  });

  it("should render keyboard shortcuts", () => {
    render(<ModeToggle />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should highlight settings mode when active", () => {
    (useAtom as any).mockReturnValue(["settings", mockSetAppMode]);

    const { container } = render(<ModeToggle />);

    const buttons = container.querySelectorAll("button");
    const settingsButton = buttons[0];
    expect(settingsButton).toHaveAttribute("data-variant", "default");
  });

  it("should highlight chat mode when active", () => {
    (useAtom as any).mockReturnValue(["chat", mockSetAppMode]);

    const { container } = render(<ModeToggle />);

    const buttons = container.querySelectorAll("button");
    const chatButton = buttons[1];
    expect(chatButton).toHaveAttribute("data-variant", "default");
  });

  it("should call setAppMode when settings button clicked", () => {
    render(<ModeToggle />);

    const settingsButton = screen.getByText("Settings");
    fireEvent.click(settingsButton);

    expect(mockSetAppMode).toHaveBeenCalledWith("settings");
  });

  it("should call setAppMode when chat button clicked", () => {
    render(<ModeToggle />);

    const chatButton = screen.getByText("Chat");
    fireEvent.click(chatButton);

    expect(mockSetAppMode).toHaveBeenCalledWith("chat");
  });

  it("should apply custom className", () => {
    const { container } = render(<ModeToggle className="custom-class" />);

    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("should apply custom style", () => {
    const { container } = render(<ModeToggle style={{ color: "red" }} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.color).toBe("red");
  });

  it("should have correct structure classes", () => {
    const { container } = render(<ModeToggle />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex");
    expect(wrapper).toHaveClass("items-center");
    expect(wrapper).toHaveClass("gap-1");
  });

  it("should have rounded corners", () => {
    const { container } = render(<ModeToggle />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("rounded-md");
  });

  it("should have background color", () => {
    const { container } = render(<ModeToggle />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("bg-muted");
  });

  it("should render both buttons with correct variants in settings mode", () => {
    (useAtom as any).mockReturnValue(["settings", mockSetAppMode]);

    const { container } = render(<ModeToggle />);

    const buttons = container.querySelectorAll("button");
    expect(buttons[0]).toHaveAttribute("data-variant", "default");
    expect(buttons[1]).toHaveAttribute("data-variant", "ghost");
  });

  it("should render both buttons with correct variants in chat mode", () => {
    (useAtom as any).mockReturnValue(["chat", mockSetAppMode]);

    const { container } = render(<ModeToggle />);

    const buttons = container.querySelectorAll("button");
    expect(buttons[0]).toHaveAttribute("data-variant", "ghost");
    expect(buttons[1]).toHaveAttribute("data-variant", "default");
  });

  it("should handle multiple mode changes", () => {
    render(<ModeToggle />);

    const settingsButton = screen.getByText("Settings");
    const chatButton = screen.getByText("Chat");

    fireEvent.click(settingsButton);
    expect(mockSetAppMode).toHaveBeenLastCalledWith("settings");

    fireEvent.click(chatButton);
    expect(mockSetAppMode).toHaveBeenLastCalledWith("chat");

    fireEvent.click(settingsButton);
    expect(mockSetAppMode).toHaveBeenLastCalledWith("settings");
  });

  it("should setup keyboard shortcuts on mount", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    render(<ModeToggle />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("should cleanup keyboard shortcuts on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<ModeToggle />);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("should handle Ctrl+1 keyboard shortcut", () => {
    render(<ModeToggle />);

    const event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });

    window.dispatchEvent(event);

    expect(mockSetAppMode).toHaveBeenCalledWith("settings");
  });

  it("should handle Cmd+2 keyboard shortcut", () => {
    render(<ModeToggle />);

    const event = new KeyboardEvent("keydown", {
      key: "2",
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      altKey: false,
    });

    window.dispatchEvent(event);

    expect(mockSetAppMode).toHaveBeenCalledWith("chat");
  });

  it("should not trigger on modifier combinations with shift", () => {
    render(<ModeToggle />);

    const event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      shiftKey: true,
      altKey: false,
    });

    window.dispatchEvent(event);

    expect(mockSetAppMode).not.toHaveBeenCalled();
  });

  it("should not trigger on modifier combinations with alt", () => {
    render(<ModeToggle />);

    const event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      shiftKey: false,
      altKey: true,
    });

    window.dispatchEvent(event);

    expect(mockSetAppMode).not.toHaveBeenCalled();
  });

  it("should not trigger on other keys", () => {
    render(<ModeToggle />);

    const event = new KeyboardEvent("keydown", {
      key: "3",
      ctrlKey: true,
    });

    window.dispatchEvent(event);

    expect(mockSetAppMode).not.toHaveBeenCalled();
  });

  it("should have padding", () => {
    const { container } = render(<ModeToggle />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("p-1");
  });

  it("should render without crashing", () => {
    expect(() => render(<ModeToggle />)).not.toThrow();
  });

  it("should render with all props provided", () => {
    expect(() =>
      render(<ModeToggle className="test" style={{ margin: "10px" }} />)
    ).not.toThrow();
  });
});
