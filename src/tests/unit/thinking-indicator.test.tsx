/**
 * Pragmatic tests for ThinkingIndicator component
 * Tests actual rendering and styling behavior
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThinkingIndicator } from "@/renderer/features/chat/components/thinking-indicator";

// Top-level regex patterns for performance
const THINKING_WITH_DURATION_REGEX = /Thinking.*\(.*s\)/;
const THINKING_REGEX = /Thinking/;
const STILL_THINKING_REGEX = /Still thinking/;

// Mock jotai properly with factory function
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtom: vi.fn(),
  };
});

// Import after mocking
import { useAtom } from "jotai";

describe("ThinkingIndicator", () => {
  it("should show 'Thinking...' when no start time", () => {
    (useAtom as any).mockReturnValue([undefined, vi.fn()]);

    render(<ThinkingIndicator />);

    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });

  it("should render Brain icon", () => {
    (useAtom as any).mockReturnValue([undefined, vi.fn()]);

    const { container } = render(<ThinkingIndicator />);

    const brainIcon = container.querySelector(".animate-pulse");
    expect(brainIcon).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    (useAtom as any).mockReturnValue([undefined, vi.fn()]);

    const { container } = render(
      <ThinkingIndicator className="custom-class" />
    );

    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("should have correct text styling", () => {
    (useAtom as any).mockReturnValue([undefined, vi.fn()]);

    const { container } = render(<ThinkingIndicator />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("text-sm", "text-muted-foreground");
  });

  it("should have flex layout with gap", () => {
    (useAtom as any).mockReturnValue([undefined, vi.fn()]);

    const { container } = render(<ThinkingIndicator />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
  });

  it("should render without crashing when start time is set", () => {
    (useAtom as any).mockReturnValue([Date.now() - 5000, vi.fn()]);

    expect(() => render(<ThinkingIndicator />)).not.toThrow();
  });

  it("should display duration when start time is in the past", () => {
    (useAtom as any).mockReturnValue([Date.now() - 5000, vi.fn()]);

    render(<ThinkingIndicator />);

    // Should show some text with "Thinking" and "(5s)" or similar
    expect(screen.getByText(THINKING_WITH_DURATION_REGEX)).toBeInTheDocument();
  });

  it("should cleanup interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    (useAtom as any).mockReturnValue([Date.now() - 1000, vi.fn()]);

    const { unmount } = render(<ThinkingIndicator />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("should handle changing start time", () => {
    (useAtom as any).mockReturnValue([Date.now() - 1000, vi.fn()]);

    const { rerender } = render(<ThinkingIndicator />);

    expect(screen.getByText(THINKING_REGEX)).toBeInTheDocument();

    // Change start time
    (useAtom as any).mockReturnValue([Date.now() - 8000, vi.fn()]);
    rerender(<ThinkingIndicator />);

    expect(screen.getByText(THINKING_REGEX)).toBeInTheDocument();
  });

  it("should show 'Still thinking' for long durations", () => {
    (useAtom as any).mockReturnValue([Date.now() - 15_000, vi.fn()]);

    render(<ThinkingIndicator />);

    expect(screen.getByText(STILL_THINKING_REGEX)).toBeInTheDocument();
  });
});
