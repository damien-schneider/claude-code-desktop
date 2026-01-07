import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdvancedSettingsEditor } from "@/renderer/components/Settings/advanced-settings-editor";

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

    // Check for alwaysThinkingEnabled switch
    const thinkingSwitch = screen.getByRole("switch", {
      name: /always thinking enabled/i,
    });
    expect(thinkingSwitch).toBeInTheDocument();
    expect(thinkingSwitch).not.toBeChecked();
  });

  it("should call onChange when toggle changes", () => {
    const settings = {
      alwaysThinkingEnabled: false,
    };

    const handleChange = vi.fn();
    render(
      <AdvancedSettingsEditor onChange={handleChange} settings={settings} />
    );

    const toggle = screen.getByRole("switch", {
      name: /always thinking enabled/i,
    });
    fireEvent.click(toggle);

    expect(handleChange).toHaveBeenCalledWith({
      alwaysThinkingEnabled: true,
    });
  });
});
