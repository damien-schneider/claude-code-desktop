import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsForm } from "@/renderer/components/settings/settings-form";
import type { ClaudeSettings } from "@/renderer/components/settings/settings-types";

// Top-level regex patterns for performance
const PERMISSIONS_TAB_REGEX = /permissions/i;
const MCP_SERVERS_TAB_REGEX = /mcp servers/i;
const HOOKS_TAB_REGEX = /hooks/i;
const ENV_VARS_TAB_REGEX = /env vars/i;
const PLUGINS_TAB_REGEX = /plugins/i;
const ADVANCED_TAB_REGEX = /advanced/i;

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
        screen.getByRole("tab", { name: PERMISSIONS_TAB_REGEX })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: MCP_SERVERS_TAB_REGEX })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: HOOKS_TAB_REGEX })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: ENV_VARS_TAB_REGEX })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: PLUGINS_TAB_REGEX })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: ADVANCED_TAB_REGEX })
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
