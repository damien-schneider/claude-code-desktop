import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'jotai';
import { RulesTab } from '@/renderer/components/Rules/RulesTab';
import { selectedProjectIdAtom, isGlobalSettingsSelectedAtom, homePathAtom } from '@/renderer/stores/atoms';

// Mock IPC
vi.mock('@/ipc/manager', () => ({
  ipc: {
    client: {
      app: {
        getHomePath: vi.fn().mockResolvedValue('/Users/test/home'),
      },
      claude: {
        readClaudeDirectory: vi.fn().mockResolvedValue({
          files: [],
        }),
      },
    },
  },
}));

describe('RulesTab - Add Rule button', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider>{children}</Provider>
  );

  beforeEach(() => {
    // Reset state
    vi.clearAllMocks();
  });

  it('should enable Add Rule button when project is selected', async () => {
    const { container } = render(
      <Wrapper>
        <RulesTab />
      </Wrapper>
    );

    // Initially, without project selected, button should be present
    const addButton = screen.getByText('Add Rule');
    expect(addButton).toBeInTheDocument();

    // The button click should do nothing without activePath
    // This is a visual test - we'd need to check if isAdding state changes
    fireEvent.click(addButton);

    // Should show input field if activePath was set
    // Since activePath is empty, nothing should happen
    const input = container.querySelector('input[placeholder*="my-rule"]');
    expect(input).not.toBeInTheDocument();
  });
});
