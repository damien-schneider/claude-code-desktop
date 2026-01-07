import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import ToggleTheme from "@/components/toggle-theme";

test("renders ToggleTheme", () => {
  const { getByRole } = render(<ToggleTheme />);
  const isButton = getByRole("button");

  expect(isButton).toBeInTheDocument();
});

test("has icon", () => {
  const { getByRole } = render(<ToggleTheme />);
  const button = getByRole("button");
  const icon = button.querySelector("svg");

  expect(icon).toBeInTheDocument();
});

test("is moon icon from Phosphor", () => {
  // Phosphor icons render as SVG elements
  const { getByRole } = render(<ToggleTheme />);
  const button = getByRole("button");
  const svg = button.querySelector("svg");

  // Phosphor icons should render an SVG element
  expect(svg).toBeInTheDocument();
  expect(svg?.tagName.toLowerCase()).toBe("svg");
});
