import { useAtom } from "jotai";
import type React from "react";
import { AgentsTab } from "@/renderer/components/agents/agents-tab";
import { ChatLayout } from "@/renderer/components/chat";
import { ClaudeTab } from "@/renderer/components/claude-tab/claude-tab";
import { CommandsTab } from "@/renderer/components/commands/commands-tab";
// Direct imports instead of lazy loading to avoid Vite dynamic import errors
import { FilesTab } from "@/renderer/components/files/files-tab";
import { HooksTab } from "@/renderer/components/hooks/hooks-tab";
import { McpTab } from "@/renderer/components/mcp/mcp-tab";
import { RulesTab } from "@/renderer/components/rules/rules-tab";
import { SettingsTab } from "@/renderer/components/settings/settings-tab";
import { SkillsTab } from "@/renderer/components/skills/skills-tab";
import { currentViewAtom, type NavigationView } from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

export interface ContentViewProps {
  className?: string;
}

const VIEW_COMPONENTS: Record<NavigationView, React.ComponentType> = {
  chat: ChatLayout,
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

const _VIEW_TITLES: Record<NavigationView, string> = {
  chat: "Chat",
  files: "File Explorer",
  claudemd: "CLAUDE.md",
  rules: "Rules",
  skills: "Skills",
  agents: "Agents",
  hooks: "Hooks",
  commands: "Commands",
  settings: "Settings",
  mcp: "MCP Servers",
};

export const ContentView: React.FC<ContentViewProps> = ({ className }) => {
  const [currentView] = useAtom(currentViewAtom);

  // Show chat layout when chat view is selected
  if (currentView === "chat") {
    return <ChatLayout className={className} />;
  }

  // Show other views
  const ViewComponent = VIEW_COMPONENTS[currentView];

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <ViewComponent />
      </div>
    </div>
  );
};

export default ContentView;
