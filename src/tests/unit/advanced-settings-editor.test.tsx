import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedSettingsEditor } from '@/renderer/components/Settings/advanced-settings-editor';

describe('AdvancedSettingsEditor', () => {
  it('should render AI behavior settings with Brain icon', () => {
    const settings = {
      alwaysThinkingEnabled: false,
      customTimeout: 30000,
    };

    const handleChange = vi.fn();
    render(<AdvancedSettingsEditor settings={settings} onChange={handleChange} />);

    // Check for the Brain icon (via aria-label or test id)
    const brainIcon = document.querySelector('[data-lucide="brain"]');
    expect(brainIcon).toBeInTheDocument();

    // Check for alwaysThinkingEnabled switch
    const thinkingSwitch = screen.getByRole('switch', { name: /always thinking enabled/i });
    expect(thinkingSwitch).toBeInTheDocument();
    expect(thinkingSwitch).not.toBeChecked();
  });

  it('should call onChange when toggle changes', () => {
    const settings = {
      alwaysThinkingEnabled: false,
    };

    const handleChange = vi.fn();
    render(<AdvancedSettingsEditor settings={settings} onChange={handleChange} />);

    const toggle = screen.getByRole('switch', { name: /always thinking enabled/i });
    fireEvent.click(toggle);

    expect(handleChange).toHaveBeenCalledWith({
      alwaysThinkingEnabled: true,
    });
  });
});
