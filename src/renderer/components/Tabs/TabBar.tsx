import React from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '@/utils/tailwind';

export interface TabBarProps {
  className?: string;
  // Stub props for unused component
  openTabs?: Array<{ id: string; title: string }>;
  activeTabId?: string;
  onCloseTab?: (tabId: string) => void;
  onSetActiveTab?: (tabId: string) => void;
}

/**
 * Legacy tab bar component - currently unused
 * The app now uses navigation views (currentView) instead of browser-style tabs
 */
export const TabBar: React.FC<TabBarProps> = ({
  className,
  openTabs = [],
  activeTabId,
  onCloseTab,
  onSetActiveTab,
}) => {
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onCloseTab?.(tabId);
  };

  if (openTabs.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 px-4 py-2 border-b bg-muted/20', className)}>
        <span className="text-sm text-muted-foreground">No tabs open</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 border-b bg-muted/20 overflow-x-auto', className)}>
      {openTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSetActiveTab?.(tab.id)}
          className={cn(
            'group flex items-center gap-2 px-3 py-2 rounded-t-md text-sm transition-colors relative min-w-[120px] max-w-[200px]',
            activeTabId === tab.id
              ? 'bg-background text-foreground border border-b-0'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
        >
          <span className="truncate">{tab.title}</span>
          <button
            onClick={(e) => handleTabClose(e, tab.id)}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity',
              activeTabId === tab.id && 'opacity-100'
            )}
          >
            <X className="h-3 w-3" weight="regular" />
          </button>
          {activeTabId === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
