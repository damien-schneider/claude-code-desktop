import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionsEditor } from './permissions-editor';
import { McpServersEditor } from './mcp-servers-editor';
import { HooksEditor } from './hooks-editor';
import { EnvVarsEditor } from './env-vars-editor';
import { EnabledPluginsEditor } from './enabled-plugins-editor';
import { AdvancedSettingsEditor } from './advanced-settings-editor';
import type { SettingsFormProps } from './settings-types';
import type { ClaudePermissions, McpServerConfig as McpServerConfigType, ClaudeHook } from './settings-types';

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
    <div className="h-full flex flex-col">
      <Tabs value={activeSection} onValueChange={(v: string) => onSectionChange(v as 'permissions' | 'mcp' | 'hooks' | 'env' | 'plugins' | 'advanced')}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
          <TabsTrigger value="hooks">Hooks</TabsTrigger>
          <TabsTrigger value="env">Env Vars</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4">
          <TabsContent value="permissions" className="mt-0 h-full">
            <PermissionsEditor
              permissions={settings.permissions || {}}
              onChange={(perms) => onChange({ ...settings, permissions: perms })}
            />
          </TabsContent>

          <TabsContent value="mcp" className="mt-0 h-full">
            <McpServersEditor
              mcpServers={settings.mcpServers || {}}
              onChange={(servers) => onChange({ ...settings, mcpServers: servers })}
            />
          </TabsContent>

          <TabsContent value="hooks" className="mt-0 h-full">
            <HooksEditor
              hooks={settings.hooks || {}}
              onChange={(hooks) => onChange({ ...settings, hooks })}
            />
          </TabsContent>

          <TabsContent value="env" className="mt-0 h-full">
            <EnvVarsEditor
              env={settings.env || {}}
              onChange={(env) => onChange({ ...settings, env })}
            />
          </TabsContent>

          <TabsContent value="plugins" className="mt-0 h-full">
            <EnabledPluginsEditor
              enabledPlugins={settings.enabledPlugins || {}}
              onChange={(plugins) => onChange({ ...settings, enabledPlugins: plugins })}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-0 h-full">
            <AdvancedSettingsEditor
              settings={{
                alwaysThinkingEnabled: settings.alwaysThinkingEnabled,
              }}
              onChange={(advancedSettings) => onChange({ ...settings, ...advancedSettings })}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
