import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnvVarsEditor } from "@/renderer/components/Settings/env-vars-editor";
import type { EnvVars } from "@/renderer/components/Settings/settings-types";

describe("EnvVarsEditor", () => {
  it("should render all environment variables", () => {
    const env: EnvVars = {
      ANTHROPIC_AUTH_TOKEN: "test-token",
      API_TIMEOUT_MS: "5000",
    };

    const handleChange = vi.fn();
    render(<EnvVarsEditor env={env} onChange={handleChange} />);

    // Check that the standard variables section is rendered
    expect(screen.getByText("Standard Variables")).toBeInTheDocument();

    // Check that descriptions are rendered (from getFieldDescription in json-field-detector.ts)
    expect(
      screen.getByText("Authentication token for Anthropic API")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Request timeout in milliseconds")
    ).toBeInTheDocument();

    // Check that inputs with correct values are rendered
    expect(screen.getByDisplayValue("test-token")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5000")).toBeInTheDocument();
  });

  it("should call onChange when field value changes", () => {
    const env: EnvVars = {
      ANTHROPIC_AUTH_TOKEN: "old-token",
    };

    const handleChange = vi.fn();
    render(<EnvVarsEditor env={env} onChange={handleChange} />);

    // Find the input by ID (JsonFieldRenderer uses fieldKey as id)
    const input = screen.getByDisplayValue("old-token");
    fireEvent.change(input, { target: { value: "new-token" } });

    expect(handleChange).toHaveBeenCalledWith({
      ANTHROPIC_AUTH_TOKEN: "new-token",
    });
  });

  it("should allow adding custom environment variables", () => {
    const env: EnvVars = {};

    const handleChange = vi.fn();
    render(<EnvVarsEditor env={env} onChange={handleChange} />);

    const addButton = screen.getByText("Add Variable");
    fireEvent.click(addButton);

    // Should show new field input
    expect(screen.getByText("New Variable Name")).toBeInTheDocument();
  });
});
