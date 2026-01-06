import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnabledPluginsEditor } from '@/renderer/components/Settings/enabled-plugins-editor';
import type { EnabledPlugins } from '@/renderer/components/Settings/settings-types';

describe('EnabledPluginsEditor', () => {
  it('should render all plugin entries sorted alphabetically', () => {
    const plugins: EnabledPlugins = {
      'zebra-plugin': true,
      'alpha-plugin': false,
      'beta-plugin': true,
    };

    const handleChange = vi.fn();
    render(<EnabledPluginsEditor enabledPlugins={plugins} onChange={handleChange} />);

    // Check that all plugins are rendered in alphabetical order
    const pluginItems = screen.getAllByRole('listitem');
    expect(pluginItems).toHaveLength(3);

    // Verify alphabetical order by checking the first plugin
    expect(pluginItems[0]).toHaveTextContent('alpha-plugin');
    expect(pluginItems[1]).toHaveTextContent('beta-plugin');
    expect(pluginItems[2]).toHaveTextContent('zebra-plugin');
  });

  it('should call onChange when a plugin toggle changes', () => {
    const plugins: EnabledPlugins = {
      'test-plugin': true,
    };

    const handleChange = vi.fn();
    render(<EnabledPluginsEditor enabledPlugins={plugins} onChange={handleChange} />);

    // Find and click the toggle switch
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(handleChange).toHaveBeenCalledWith({
      'test-plugin': false,
    });
  });

  it('should allow adding and removing plugin entries', () => {
    const plugins: EnabledPlugins = {
      'existing-plugin': true,
    };

    const handleChange = vi.fn();
    render(<EnabledPluginsEditor enabledPlugins={plugins} onChange={handleChange} />);

    // Click "Add Plugin" button
    const addButton = screen.getByText('Add Plugin');
    fireEvent.click(addButton);

    // Should show new plugin input
    expect(screen.getByText('New Plugin ID')).toBeInTheDocument();

    // Remove the existing plugin
    const deleteButtons = screen.getAllByLabelText(/remove/i);
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    expect(handleChange).toHaveBeenCalledWith({});
  });
});
