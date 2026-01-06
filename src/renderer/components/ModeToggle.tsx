import React, { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { Gear, ChatCircleText } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { appModeAtom, setAppModeAtom, type AppMode } from '@/renderer/stores';
import { cn } from '@/utils/tailwind';

export interface ModeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Toggle between Settings Mode and Chat Mode
 * Keyboard shortcuts: Cmd+1 for Settings, Cmd+2 for Chat
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({ className, style }) => {
  const [appMode] = useAtom(appModeAtom);
  const setAppMode = useSetAtom(setAppModeAtom);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + 1 or 2
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setAppMode('settings');
        } else if (e.key === '2') {
          e.preventDefault();
          setAppMode('chat');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setAppMode]);

  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
  };

  return (
    <div
      className={cn('flex items-center gap-1 p-1 bg-muted rounded-md', className)}
      style={style}
    >
      <Button
        size="sm"
        variant={appMode === 'settings' ? 'default' : 'ghost'}
        onClick={() => handleModeChange('settings')}
        className="gap-1.5 h-7"
      >
        <Gear className="h-3.5 w-3.5" weight="regular" />
        <span>Settings</span>
        <kbd className="ml-1 px-1 py-0.5 text-[10px] font-mono text-muted-foreground/70 bg-muted-foreground/20 rounded">
          1
        </kbd>
      </Button>
      <Button
        size="sm"
        variant={appMode === 'chat' ? 'default' : 'ghost'}
        onClick={() => handleModeChange('chat')}
        className="gap-1.5 h-7"
      >
        <ChatCircleText className="h-3.5 w-3.5" weight="regular" />
        <span>Chat</span>
        <kbd className="ml-1 px-1 py-0.5 text-[10px] font-mono text-muted-foreground/70 bg-muted-foreground/20 rounded">
          2
        </kbd>
      </Button>
    </div>
  );
};

export default ModeToggle;
