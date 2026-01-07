/**
 * Pragmatic tests for TabBar component
 * Tests actual rendering and user interactions
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TabBar } from "@/renderer/components/tabs/tab-bar";

describe("TabBar", () => {
  it("should render no tabs message when openTabs is empty", () => {
    render(<TabBar openTabs={[]} />);

    expect(screen.getByText("No tabs open")).toBeInTheDocument();
  });

  it("should render tabs with titles", () => {
    const tabs = [
      { id: "1", title: "Tab 1" },
      { id: "2", title: "Tab 2" },
    ];

    render(<TabBar openTabs={tabs} />);

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
  });

  it("should highlight active tab", () => {
    const tabs = [
      { id: "1", title: "Tab 1" },
      { id: "2", title: "Tab 2" },
    ];

    const { container } = render(<TabBar activeTabId="1" openTabs={tabs} />);

    const buttons = container.querySelectorAll("button");
    // First tab should have active styling (bg-background)
    expect(buttons[0]).toHaveClass("bg-background");
    // Second tab should not have active styling
    expect(buttons[1]).not.toHaveClass("bg-background");
  });

  it("should call onSetActiveTab when tab is clicked", () => {
    const onSetActiveTab = vi.fn();
    const tabs = [{ id: "1", title: "Tab 1" }];

    render(<TabBar onSetActiveTab={onSetActiveTab} openTabs={tabs} />);

    fireEvent.click(screen.getByText("Tab 1"));

    expect(onSetActiveTab).toHaveBeenCalledWith("1");
  });

  it("should call onCloseTab when close button is clicked", () => {
    const onCloseTab = vi.fn();
    const tabs = [{ id: "1", title: "Tab 1" }];

    render(<TabBar onCloseTab={onCloseTab} openTabs={tabs} />);

    // Find and click the close button
    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    expect(onCloseTab).toHaveBeenCalledWith("1");
  });

  it("should not call onSetActiveTab when close button is clicked", () => {
    const onSetActiveTab = vi.fn();
    const onCloseTab = vi.fn();
    const tabs = [{ id: "1", title: "Tab 1" }];

    render(
      <TabBar
        onCloseTab={onCloseTab}
        onSetActiveTab={onSetActiveTab}
        openTabs={tabs}
      />
    );

    const closeButton = screen.getAllByRole("button")[1]; // Second button is close
    fireEvent.click(closeButton);

    expect(onSetActiveTab).not.toHaveBeenCalled();
    expect(onCloseTab).toHaveBeenCalledWith("1");
  });

  it("should show close button on active tab", () => {
    const tabs = [{ id: "1", title: "Tab 1" }];

    const { container } = render(<TabBar activeTabId="1" openTabs={tabs} />);

    const closeButton = container.querySelector(
      "button.group-hover\\:opacity-100"
    );
    // Active tab should have opacity-100 class
    expect(closeButton).toHaveClass("opacity-100");
  });

  it("should hide close button on inactive tab until hovered", () => {
    const tabs = [
      { id: "1", title: "Tab 1" },
      { id: "2", title: "Tab 2" },
    ];

    const { container } = render(<TabBar activeTabId="1" openTabs={tabs} />);

    const buttons = container.querySelectorAll(
      "button.group-hover\\:opacity-100"
    );
    // First tab (active) should be visible
    expect(buttons[0]).toHaveClass("opacity-100");
    // Second tab (inactive) should be hidden
    expect(buttons[1]).toHaveClass("opacity-0");
  });

  it("should handle multiple tabs", () => {
    const tabs = [
      { id: "1", title: "Claude.md" },
      { id: "2", title: "Files" },
      { id: "3", title: "Hooks" },
    ];

    render(<TabBar openTabs={tabs} />);

    expect(screen.getByText("Claude.md")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
    expect(screen.getByText("Hooks")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const tabs = [{ id: "1", title: "Tab 1" }];

    const { container } = render(
      <TabBar className="custom-class" openTabs={tabs} />
    );

    const tabBar = container.firstChild as HTMLElement;
    expect(tabBar).toHaveClass("custom-class");
  });

  it("should handle empty tab array gracefully", () => {
    render(<TabBar openTabs={[]} />);

    expect(screen.getByText("No tabs open")).toBeInTheDocument();
  });

  it("should render without crashing when no callbacks provided", () => {
    const tabs = [{ id: "1", title: "Tab 1" }];

    // Should not throw
    expect(() => render(<TabBar openTabs={tabs} />)).not.toThrow();
  });

  it("should display active tab indicator", () => {
    const tabs = [{ id: "1", title: "Tab 1" }];

    const { container } = render(<TabBar activeTabId="1" openTabs={tabs} />);

    const indicator = container.querySelector(".bg-primary");
    expect(indicator).toBeInTheDocument();
  });

  it("should not display active tab indicator for inactive tabs", () => {
    const tabs = [
      { id: "1", title: "Tab 1" },
      { id: "2", title: "Tab 2" },
    ];

    const { container } = render(<TabBar activeTabId="2" openTabs={tabs} />);

    const firstTab = container.querySelectorAll("button")[0];
    // First tab should not have indicator (no .bg-primary child)
    const indicator = firstTab.querySelector(".bg-primary");
    expect(indicator).toBeNull();
  });
});
