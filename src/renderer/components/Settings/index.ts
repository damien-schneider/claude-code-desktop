/**
 * Settings components module
 * Exports all settings-related components and types
 */

// Main component
export { SettingsTab } from './settings-tab';

// Form components
export { SettingsForm } from './settings-form';
export { PermissionsEditor } from './permissions-editor';
export { McpServersEditor } from './mcp-servers-editor';
export { HooksEditor } from './hooks-editor';

// Shared components
export { ToolPatternList } from './tool-pattern-list';
export { McpServerConfig } from './mcp-server-config';
export { SettingsJSONEditor } from './settings-json-editor';
export { ModeToggle } from './mode-toggle';

// Types
export type {
  ClaudeSettings,
  ClaudePermissions,
  McpServerConfig as McpServerConfigType,
  ClaudeHook,
  ToolPatternListProps,
  PermissionsEditorProps,
  McpServersEditorProps,
  McpServerConfigProps,
  HooksEditorProps,
  SettingsFormProps,
  SettingsJSONEditorProps,
  EditorMode,
} from './settings-types';
