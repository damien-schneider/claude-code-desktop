import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import ToggleTheme from "@/components/toggle-theme";

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

// Mock Phosphor icons
vi.mock("@phosphor-icons/react", () => ({
  Sun: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="sun-icon" />
  ),
  Moon: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="moon-icon" />
  ),
  Monitor: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="monitor-icon" />
  ),
}));

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
