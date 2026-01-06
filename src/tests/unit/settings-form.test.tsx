import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsForm } from '@/renderer/components/Settings/settings-form';
import type { ClaudeSettings } from '@/renderer/components/Settings/settings-types';

describe('SettingsForm', () => {
  const mockSettings: ClaudeSettings = {
    permissions: {
      allow: ['bash', 'read'],
    },
    mcpServers: {
      'test-server': {
        command: 'node',
        args: ['server.js'],
      },
    },
    hooks: {
      'user-prompt': [
        {
          type: 'user-prompt',
          command: 'echo "test"',
        },
      ],
    },
    env: {
      ANTHROPIC_AUTH_TOKEN: 'test-token',
    },
    enabledPlugins: {
      'test-plugin': true,
    },
    alwaysThinkingEnabled: true,
  };

  const mockOnChange = () => {};
  const mockOnSectionChange = () => {};

  describe('tab configuration', () => {
    it('should render all 6 tabs', () => {
      render(
        <SettingsForm
          settings={mockSettings}
          onChange={mockOnChange}
          activeSection="permissions"
          onSectionChange={mockOnSectionChange}
        />
      );

      // Check for all 6 tab triggers
      expect(screen.getByRole('tab', { name: /permissions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /mcp servers/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /hooks/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /env vars/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /plugins/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /advanced/i })).toBeInTheDocument();
    });

    it('should render content for the active tab', () => {
      render(
        <SettingsForm
          settings={mockSettings}
          onChange={mockOnChange}
          activeSection="permissions"
          onSectionChange={mockOnSectionChange}
        />
      );

      // Check that the active tabpanel exists
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });
});
