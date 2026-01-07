/**
 * Pragmatic tests for ThinkingIndicator component
 * Tests actual rendering and styling behavior
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThinkingIndicator } from "@/renderer/components/chat/thinking-indicator";

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
    vi.mocked(useAtom).mockReturnValue([undefined, vi.fn()]);

    render(<ThinkingIndicator />);

    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });

  it("should render Brain icon", () => {
    vi.mocked(useAtom).mockReturnValue([undefined, vi.fn()]);

    const { container } = render(<ThinkingIndicator />);

    const brainIcon = container.querySelector(".animate-pulse");
    expect(brainIcon).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    vi.mocked(useAtom).mockReturnValue([undefined, vi.fn()]);

    const { container } = render(
      <ThinkingIndicator className="custom-class" />
    );

    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("should have correct text styling", () => {
    vi.mocked(useAtom).mockReturnValue([undefined, vi.fn()]);

    const { container } = render(<ThinkingIndicator />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("text-sm", "text-muted-foreground");
  });

  it("should have flex layout with gap", () => {
    vi.mocked(useAtom).mockReturnValue([undefined, vi.fn()]);

    const { container } = render(<ThinkingIndicator />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
  });

  it("should render without crashing when start time is set", () => {
    vi.mocked(useAtom).mockReturnValue([Date.now() - 5000, vi.fn()]);

    expect(() => render(<ThinkingIndicator />)).not.toThrow();
  });

  it("should display duration when start time is in the past", () => {
    vi.mocked(useAtom).mockReturnValue([Date.now() - 5000, vi.fn()]);

    render(<ThinkingIndicator />);

    // Should show some text with "Thinking" and "(5s)" or similar
    expect(screen.getByText(/Thinking.*\(.*s\)/)).toBeInTheDocument();
  });

  it("should cleanup interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    vi.mocked(useAtom).mockReturnValue([Date.now() - 1000, vi.fn()]);

    const { unmount } = render(<ThinkingIndicator />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("should handle changing start time", () => {
    vi.mocked(useAtom).mockReturnValue([Date.now() - 1000, vi.fn()]);

    const { rerender } = render(<ThinkingIndicator />);

    expect(screen.getByText(/Thinking/)).toBeInTheDocument();

    // Change start time
    vi.mocked(useAtom).mockReturnValue([Date.now() - 8000, vi.fn()]);
    rerender(<ThinkingIndicator />);

    expect(screen.getByText(/Thinking/)).toBeInTheDocument();
  });

  it("should show 'Still thinking' for long durations", () => {
    vi.mocked(useAtom).mockReturnValue([Date.now() - 15_000, vi.fn()]);

    render(<ThinkingIndicator />);

    expect(screen.getByText(/Still thinking/)).toBeInTheDocument();
  });
});
