import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JsonFieldRenderer } from "@/renderer/components/Settings/json-field-renderer";

describe("JsonFieldRenderer", () => {
  it("should render string field with input", () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="test_field"
        onChange={handleChange}
        value="hello"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("hello");
  });

  it("should render boolean field with switch", () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="enabled"
        onChange={handleChange}
        value={true}
      />
    );

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeInTheDocument();
  });

  it("should call onChange when string input changes", () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer fieldKey="name" onChange={handleChange} value="old" />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new" } });

    expect(handleChange).toHaveBeenCalledWith("new");
  });

  it("should render secret field with password input", () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="api_token"
        onChange={handleChange}
        value="secret123"
      />
    );

    const input = screen.getByDisplayValue("secret123");
    expect(input).toHaveAttribute("type", "password");
  });

  it("should render object field with nested fields", () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="config"
        onChange={handleChange}
        value={{ host: "localhost", port: 8080 }}
      />
    );

    expect(screen.getByText("Host")).toBeInTheDocument();
    expect(screen.getByText("Port")).toBeInTheDocument();
  });
});
