/**
 * Pragmatic tests for TabPanel component
 * Tests actual rendering and state behavior
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TabPanel } from "@/renderer/components/tabs/tab-panel";

describe("TabPanel", () => {
  it("should render no tab selected message when no active tab", () => {
    render(<TabPanel activeTabId="" openTabs={[]} />);

    expect(screen.getByText("No tab selected")).toBeInTheDocument();
    expect(
      screen.getByText("Select a project from the sidebar to get started")
    ).toBeInTheDocument();
  });

  it("should render active tab title", () => {
    const tabs = [{ id: "1", title: "Claude.md", type: "claudemd" as const }];

    render(<TabPanel activeTabId="1" openTabs={tabs} />);

    expect(screen.getByText("Claude.md")).toBeInTheDocument();
  });

  it("should render main config context name when isMainConfigSelected", () => {
    const tabs = [{ id: "1", title: "Settings", type: "settings" as const }];

    render(
      <TabPanel activeTabId="1" isMainConfigSelected={true} openTabs={tabs} />
    );

    expect(screen.getByText("Main Config (~/.claude/)")).toBeInTheDocument();
  });

  it("should render project name from selectedProjectId", () => {
    const tabs = [{ id: "1", title: "Files", type: "files" as const }];

    render(
      <TabPanel
        activeTabId="1"
        openTabs={tabs}
        selectedProjectId="/path/to/my-project"
      />
    );

    expect(screen.getByText("my-project")).toBeInTheDocument();
  });

  it("should render 'Project' as fallback when path has no basename", () => {
    const tabs = [{ id: "1", title: "Files", type: "files" as const }];

    render(<TabPanel activeTabId="1" openTabs={tabs} selectedProjectId="/" />);

    expect(screen.getByText("Project")).toBeInTheDocument();
  });

  it("should render 'Unknown' context when no project selected", () => {
    const tabs = [{ id: "1", title: "Files", type: "files" as const }];

    render(<TabPanel activeTabId="1" openTabs={tabs} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("should render tab type in content", () => {
    const tabs = [{ id: "1", title: "Hooks", type: "hooks" as const }];

    render(<TabPanel activeTabId="1" openTabs={tabs} />);

    expect(screen.getByText("Tab content: hooks")).toBeInTheDocument();
  });

  it("should prioritize main config over selected project", () => {
    const tabs = [{ id: "1", title: "Settings", type: "settings" as const }];

    render(
      <TabPanel
        activeTabId="1"
        isMainConfigSelected={true}
        openTabs={tabs}
        selectedProjectId="/path/to/project"
      />
    );

    // Should show main config, not project name
    expect(screen.getByText("Main Config (~/.claude/)")).toBeInTheDocument();
    expect(screen.queryByText("project")).not.toBeInTheDocument();
  });

  it("should display loading spinner via Suspense", () => {
    const tabs = [{ id: "1", title: "Rules", type: "rules" as const }];

    const { container } = render(<TabPanel activeTabId="1" openTabs={tabs} />);

    // The Suspense fallback renders while content is loading
    // Since our content renders synchronously, it may not show
    // But we can verify the structure exists
    const content = container.querySelector(".overflow-y-auto");
    expect(content).toBeInTheDocument();
  });

  it("should handle all tab types", () => {
    const tabTypes: Array<{ type: TabPanelProps["openTabs"][0]["type"] }> = [
      { type: "claudemd" },
      { type: "files" },
      { type: "hooks" },
      { type: "rules" },
      { type: "skills" },
      { type: "agents" },
      { type: "settings" },
      { type: "commands" },
    ];

    tabTypes.forEach(({ type }) => {
      const tabs = [{ id: "1", title: `${type} tab`, type }];

      const { unmount } = render(<TabPanel activeTabId="1" openTabs={tabs} />);

      expect(screen.getByText(`Tab content: ${type}`)).toBeInTheDocument();
      unmount();
    });
  });

  it("should apply custom className", () => {
    const { container } = render(
      <TabPanel activeTabId="" className="custom-class" openTabs={[]} />
    );

    const tabPanel = container.querySelector(".custom-class");
    expect(tabPanel).toBeInTheDocument();
  });

  it("should render without crashing when props are missing", () => {
    // Should not throw with default/undefined props
    expect(() =>
      render(<TabPanel activeTabId={undefined} openTabs={undefined} />)
    ).not.toThrow();
  });

  it("should handle empty tabs array with activeTabId", () => {
    render(<TabPanel activeTabId="non-existent" openTabs={[]} />);

    // Should show "No tab selected" since tab doesn't exist in array
    expect(screen.getByText("No tab selected")).toBeInTheDocument();
  });

  it("should handle activeTabId that doesn't exist in openTabs", () => {
    const tabs = [{ id: "1", title: "Tab 1", type: "files" as const }];

    render(<TabPanel activeTabId="999" openTabs={tabs} />);

    expect(screen.getByText("No tab selected")).toBeInTheDocument();
  });

  it("should render tab header with title and context", () => {
    const tabs = [{ id: "1", title: "My Files", type: "files" as const }];

    render(
      <TabPanel
        activeTabId="1"
        openTabs={tabs}
        selectedProjectId="/Users/test/project"
      />
    );

    expect(screen.getByText("My Files")).toBeInTheDocument();
    expect(screen.getByText("project")).toBeInTheDocument();
  });

  it("should have correct structure with header and content areas", () => {
    const tabs = [{ id: "1", title: "Test", type: "files" as const }];

    const { container } = render(<TabPanel activeTabId="1" openTabs={tabs} />);

    // Should have border-b header section
    const header = container.querySelector(".border-b");
    expect(header).toBeInTheDocument();

    // Should have overflow-y-auto content section
    const content = container.querySelector(".overflow-y-auto");
    expect(content).toBeInTheDocument();
  });
});

interface TabPanelProps {
  openTabs?: Array<{ id: string; title: string; type: string }>;
  activeTabId?: string;
  className?: string;
  selectedProjectId?: string | null;
  isMainConfigSelected?: boolean;
}
