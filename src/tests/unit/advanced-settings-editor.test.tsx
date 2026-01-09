import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdvancedSettingsEditor } from "@/renderer/components/settings/advanced-settings-editor";

// Top-level regex patterns for performance
const ALWAYS_THINKING_ENABLED_REGEX = /always thinking enabled/i;

describe("AdvancedSettingsEditor", () => {
  it("should render AI behavior settings with Brain icon", () => {
    const settings = {
      alwaysThinkingEnabled: false,
      customTimeout: 30_000,
    };

    const handleChange = vi.fn();
    render(
      <AdvancedSettingsEditor onChange={handleChange} settings={settings} />
    );

    // Check for the Advanced Settings title
    const title = screen.getByText("Advanced Settings");
    expect(title).toBeInTheDocument();

    // The Brain icon from Phosphor should render an SVG in the document
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);

    // Check for alwaysThinkingEnabled label
    const label = screen.getByText(ALWAYS_THINKING_ENABLED_REGEX);
    expect(label).toBeInTheDocument();

    // Check for the switch element (Base UI uses role="switch" on a span)
    const thinkingSwitch = screen.getByRole("switch");
    expect(thinkingSwitch).toBeInTheDocument();
    expect(thinkingSwitch).toHaveAttribute("data-unchecked");
  });

  it("should call onChange when toggle changes", () => {
    const settings = {
      alwaysThinkingEnabled: false,
    };

    const handleChange = vi.fn();
    render(
      <AdvancedSettingsEditor onChange={handleChange} settings={settings} />
    );

    // Click the label to toggle the switch (more reliable than clicking the switch directly)
    const label = screen.getByText(ALWAYS_THINKING_ENABLED_REGEX);
    fireEvent.click(label);

    expect(handleChange).toHaveBeenCalledWith({
      alwaysThinkingEnabled: true,
    });
  });
});
