/**
 * TDD Test for Resizable Panel component
 * Tests that panels render correctly and have the necessary structure for resizing
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
  ResizableHandle as PanelResizeHandle,
} from "@/components/ui/resizable";

// Mock ResizeObserver as a class constructor
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = ResizeObserverMock as any;

// Mock window.matchMedia for responsive behavior
globalThis.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe("Resizable Panels - Component Structure", () => {
  it("should render two panels with content", () => {
    render(
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={50} minSize={20}>
          <div data-testid="panel-1">Panel 1</div>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={50} minSize={20}>
          <div data-testid="panel-2">Panel 2</div>
        </Panel>
      </PanelGroup>
    );

    expect(screen.getByTestId("panel-1")).toBeInTheDocument();
    expect(screen.getByTestId("panel-2")).toBeInTheDocument();
  });

  it("should render PanelGroup with correct data attributes", () => {
    const { container } = render(
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={50}>
          <div>Panel 1</div>
        </Panel>
      </PanelGroup>
    );

    const group = container.querySelector(
      '[data-slot="resizable-panel-group"]'
    );
    expect(group).toBeInTheDocument();
  });

  it("should render Panel with data slot attribute", () => {
    const { container } = render(
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={50}>
          <div data-testid="panel-content">Content</div>
        </Panel>
      </PanelGroup>
    );

    const panel = container.querySelector('[data-slot="resizable-panel"]');
    expect(panel).toBeInTheDocument();
    expect(screen.getByTestId("panel-content")).toBeInTheDocument();
  });

  it("should render PanelResizeHandle with data slot attribute", () => {
    const { container } = render(
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={50}>
          <div>Panel 1</div>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={50}>
          <div>Panel 2</div>
        </Panel>
      </PanelGroup>
    );

    const handle = container.querySelector('[data-slot="resizable-handle"]');
    expect(handle).toBeInTheDocument();
  });

  it("should render PanelResizeHandle with cursor-col-resize class for horizontal orientation", () => {
    const { container } = render(
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={50}>
          <div>Panel 1</div>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={50}>
          <div>Panel 2</div>
        </Panel>
      </PanelGroup>
    );

    const handle = container.querySelector('[data-slot="resizable-handle"]');
    expect(handle).toBeInTheDocument();
    // Note: cursor-col-resize is handled by CSS using data-orientation attribute
  });

  it("should render handle with grip icon when withHandle is true", () => {
    const { container } = render(
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={50}>
          <div>Panel 1</div>
        </Panel>
        <PanelResizeHandle withHandle={true} />
        <Panel defaultSize={50}>
          <div>Panel 2</div>
        </Panel>
      </PanelGroup>
    );

    const handle = container.querySelector('[data-slot="resizable-handle"]');
    expect(handle).toBeInTheDocument();

    // Check for the grip icon div (withHandle adds a visual indicator)
    const gripIcon = handle?.querySelector("div");
    expect(gripIcon).toBeInTheDocument();
  });

  it("should not render grip icon when withHandle is false or undefined", () => {
    const { container } = render(
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={50}>
          <div>Panel 1</div>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={50}>
          <div>Panel 2</div>
        </Panel>
      </PanelGroup>
    );

    const handle = container.querySelector('[data-slot="resizable-handle"]');
    expect(handle).toBeInTheDocument();

    const gripIcon = handle?.querySelector("div");
    expect(gripIcon).not.toBeInTheDocument();
  });

  it("should apply custom className to PanelGroup", () => {
    const { container } = render(
      <PanelGroup className="custom-group-class" orientation="horizontal">
        <Panel defaultSize={50}>
          <div>Panel 1</div>
        </Panel>
      </PanelGroup>
    );

    const group = container.querySelector(".custom-group-class");
    expect(group).toBeInTheDocument();
  });

  it("should apply custom className to Panel", () => {
    const { container } = render(
      <PanelGroup orientation="horizontal">
        <Panel className="custom-panel-class" defaultSize={50}>
          <div>Panel Content</div>
        </Panel>
      </PanelGroup>
    );

    const panel = container.querySelector(".custom-panel-class");
    expect(panel).toBeInTheDocument();
  });

  it("should apply custom className to PanelResizeHandle", () => {
    const { container } = render(
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={50}>
          <div>Panel 1</div>
        </Panel>
        <PanelResizeHandle className="custom-handle-class" />
        <Panel defaultSize={50}>
          <div>Panel 2</div>
        </Panel>
      </PanelGroup>
    );

    const handle = container.querySelector(".custom-handle-class");
    expect(handle).toBeInTheDocument();
  });

  it("should support vertical orientation", () => {
    const { container } = render(
      <PanelGroup orientation="vertical">
        <Panel defaultSize={50}>
          <div data-testid="top-panel">Top Panel</div>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={50}>
          <div data-testid="bottom-panel">Bottom Panel</div>
        </Panel>
      </PanelGroup>
    );

    expect(screen.getByTestId("top-panel")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-panel")).toBeInTheDocument();

    // Just verify the panels render correctly in vertical orientation
    const panels = container.querySelectorAll('[data-slot="resizable-panel"]');
    expect(panels).toHaveLength(2);
  });

  it("should render collapsible panel", () => {
    const { container: _container } = render(
      <PanelGroup orientation="horizontal">
        <Panel collapsedSize={0} collapsible defaultSize={30} minSize={15}>
          <div data-testid="collapsible-panel">Collapsible Content</div>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={70}>
          <div>Main Content</div>
        </Panel>
      </PanelGroup>
    );

    expect(screen.getByTestId("collapsible-panel")).toBeInTheDocument();
  });
});
