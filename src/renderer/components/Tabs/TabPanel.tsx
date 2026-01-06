import React from 'react';
import { cn } from '@/utils/tailwind';
import { Spinner } from '@phosphor-icons/react';

export type TabType = 'claudemd' | 'files' | 'hooks' | 'rules' | 'skills' | 'agents' | 'settings' | 'commands';

export interface TabPanelProps {
  className?: string;
  // Stub props for unused component
  activeTabId?: string;
  openTabs?: Array<{ id: string; title: string; type: TabType }>;
  selectedProjectId?: string | null;
  isMainConfigSelected?: boolean;
}

/**
 * Legacy tab panel component - currently unused
 * The app now uses ContentView with navigation views instead of browser-style tabs
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  className,
  activeTabId,
  openTabs = [],
  selectedProjectId,
  isMainConfigSelected,
}) => {
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  if (!activeTab) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No tab selected</p>
          <p className="text-sm">Select a project from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  const contextName = isMainConfigSelected
    ? 'Main Config (~/.claude/)'
    : selectedProjectId
    ? selectedProjectId.split('/').pop() || 'Project'
    : 'Unknown';

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tab Header */}
      <div className="px-4 py-3 border-b bg-muted/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{activeTab.title}</h2>
            <p className="text-sm text-muted-foreground">{contextName}</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spinner className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <div className="p-4 text-muted-foreground">Tab content: {activeTab.type}</div>
        </React.Suspense>
      </div>
    </div>
  );
};

export default TabPanel;
