import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedSettingsEditor } from "./advanced-settings-editor";
import { EnabledPluginsEditor } from "./enabled-plugins-editor";
import { EnvVarsEditor } from "./env-vars-editor";
import { HooksEditor } from "./hooks-editor";
import { McpServersEditor } from "./mcp-servers-editor";
import { PermissionsEditor } from "./permissions-editor";
import type { SettingsFormProps } from "./settings-types";

/**
 * Form-based editor for Claude settings
 */
export const SettingsForm: React.FC<SettingsFormProps> = ({
  settings,
  onChange,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className="flex h-full flex-col">
      <Tabs
        onValueChange={(v: string) =>
          onSectionChange(
            v as
              | "permissions"
              | "mcp"
              | "hooks"
              | "env"
              | "plugins"
              | "advanced"
          )
        }
        value={activeSection}
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
          <TabsTrigger value="hooks">Hooks</TabsTrigger>
          <TabsTrigger value="env">Env Vars</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex-1">
          <TabsContent className="mt-0 h-full" value="permissions">
            <PermissionsEditor
              onChange={(perms) =>
                onChange({ ...settings, permissions: perms })
              }
              permissions={settings.permissions || {}}
            />
          </TabsContent>

          <TabsContent className="mt-0 h-full" value="mcp">
            <McpServersEditor
              mcpServers={settings.mcpServers || {}}
              onChange={(servers) =>
                onChange({ ...settings, mcpServers: servers })
              }
            />
          </TabsContent>

          <TabsContent className="mt-0 h-full" value="hooks">
            <HooksEditor
              hooks={settings.hooks || {}}
              onChange={(hooks) => onChange({ ...settings, hooks })}
            />
          </TabsContent>

          <TabsContent className="mt-0 h-full" value="env">
            <EnvVarsEditor
              env={settings.env || {}}
              onChange={(env) => onChange({ ...settings, env })}
            />
          </TabsContent>

          <TabsContent className="mt-0 h-full" value="plugins">
            <EnabledPluginsEditor
              enabledPlugins={settings.enabledPlugins || {}}
              onChange={(plugins) =>
                onChange({ ...settings, enabledPlugins: plugins })
              }
            />
          </TabsContent>

          <TabsContent className="mt-0 h-full" value="advanced">
            <AdvancedSettingsEditor
              onChange={(advancedSettings) =>
                onChange({ ...settings, ...advancedSettings })
              }
              settings={{
                alwaysThinkingEnabled: settings.alwaysThinkingEnabled,
              }}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
