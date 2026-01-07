import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsForm } from "@/renderer/components/settings/settings-form";
import type { ClaudeSettings } from "@/renderer/components/settings/settings-types";

describe("SettingsForm", () => {
  const mockSettings: ClaudeSettings = {
    permissions: {
      allow: ["bash", "read"],
    },
    mcpServers: {
      "test-server": {
        command: "node",
        args: ["server.js"],
      },
    },
    hooks: {
      "user-prompt": [
        {
          type: "user-prompt",
          command: 'echo "test"',
        },
      ],
    },
    env: {
      ANTHROPIC_AUTH_TOKEN: "test-token",
    },
    enabledPlugins: {
      "test-plugin": true,
    },
    alwaysThinkingEnabled: true,
  };

  const mockOnChange = () => {
    // Mock function
  };
  const mockOnSectionChange = () => {
    // Mock function
  };

  describe("tab configuration", () => {
    it("should render all 6 tabs", () => {
      render(
        <SettingsForm
          activeSection="permissions"
          onChange={mockOnChange}
          onSectionChange={mockOnSectionChange}
          settings={mockSettings}
        />
      );

      // Check for all 6 tab triggers
      expect(
        screen.getByRole("tab", { name: /permissions/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /mcp servers/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /hooks/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /env vars/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /plugins/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /advanced/i })
      ).toBeInTheDocument();
    });

    it("should render content for the active tab", () => {
      render(
        <SettingsForm
          activeSection="permissions"
          onChange={mockOnChange}
          onSectionChange={mockOnSectionChange}
          settings={mockSettings}
        />
      );

      // Check that the active tabpanel exists
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });
  });
});
