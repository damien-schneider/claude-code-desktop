import { useAtom } from "jotai";
import type React from "react";
import { AgentsTab } from "@/renderer/components/Agents/AgentsTab";
import { ChatLayout } from "@/renderer/components/Chat";
import { ClaudeTab } from "@/renderer/components/ClaudeTab/ClaudeTab";
import { CommandsTab } from "@/renderer/components/Commands/CommandsTab";
// Direct imports instead of lazy loading to avoid Vite dynamic import errors
import { FilesTab } from "@/renderer/components/Files/FilesTab";
import { HooksTab } from "@/renderer/components/Hooks/HooksTab";
import { McpTab } from "@/renderer/components/mcp/mcp-tab";
import { RulesTab } from "@/renderer/components/Rules/RulesTab";
import { SettingsTab } from "@/renderer/components/Settings/settings-tab";
import { SkillsTab } from "@/renderer/components/Skills/SkillsTab";
import { currentViewAtom, type NavigationView } from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

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
