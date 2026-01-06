import React from 'react';
import { useAtom } from 'jotai';
import {
  currentViewAtom,
  appModeAtom,
  type NavigationView,
} from '@/renderer/stores';
import { cn } from '@/utils/tailwind';
import { ChatLayout } from '@/renderer/components/Chat';

// Direct imports instead of lazy loading to avoid Vite dynamic import errors
import { FilesTab } from '@/renderer/components/Files/FilesTab';
import { ClaudeTab } from '@/renderer/components/ClaudeTab/ClaudeTab';
import { RulesTab } from '@/renderer/components/Rules/RulesTab';
import { SkillsTab } from '@/renderer/components/Skills/SkillsTab';
import { AgentsTab } from '@/renderer/components/Agents/AgentsTab';
import { HooksTab } from '@/renderer/components/Hooks/HooksTab';
import { CommandsTab } from '@/renderer/components/Commands/CommandsTab';
import { SettingsTab } from '@/renderer/components/Settings/settings-tab';
import { McpTab } from '@/renderer/components/mcp/mcp-tab';

export interface ContentViewProps {
  className?: string;
}

const VIEW_COMPONENTS: Record<NavigationView, React.ComponentType> = {
  files: FilesTab,
  claudemd: ClaudeTab,
  rules: RulesTab,
  skills: SkillsTab,
  agents: AgentsTab,
  hooks: HooksTab,
  commands: CommandsTab,
  settings: SettingsTab,
  mcp: McpTab,
};

const VIEW_TITLES: Record<NavigationView, string> = {
  files: 'File Explorer',
  claudemd: 'CLAUDE.md',
  rules: 'Rules',
  skills: 'Skills',
  agents: 'Agents',
  hooks: 'Hooks',
  commands: 'Commands',
  settings: 'Settings',
  mcp: 'MCP Servers',
};

export const ContentView: React.FC<ContentViewProps> = ({ className }) => {
  const [currentView] = useAtom(currentViewAtom);
  const [appMode] = useAtom(appModeAtom);

  // Show chat layout in chat mode
  if (appMode === 'chat') {
    return <ChatLayout className={className} />;
  }

  // Original behavior for settings mode
  const ViewComponent = VIEW_COMPONENTS[currentView];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <ViewComponent />
      </div>
    </div>
  );
};

export default ContentView;
