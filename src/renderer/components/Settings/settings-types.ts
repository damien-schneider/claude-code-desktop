/**
 * Shared TypeScript interfaces for Settings components
 */

export interface EnvVars {
  ANTHROPIC_AUTH_TOKEN?: string;
  ANTHROPIC_BASE_URL?: string;
  API_TIMEOUT_MS?: string;
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC?: string;
  ANTHROPIC_DEFAULT_HAIKU_MODEL?: string;
  ANTHROPIC_DEFAULT_SONNET_MODEL?: string;
  ANTHROPIC_DEFAULT_OPUS_MODEL?: string;
  [key: string]: string | undefined; // Allow custom env vars
}

export interface EnabledPlugins {
  [pluginId: string]: boolean;
}

export interface ClaudeSettings {
  env?: EnvVars;
  permissions?: ClaudePermissions;
  mcpServers?: Record<string, McpServerConfig>;
  hooks?: Record<string, ClaudeHook[]>;
  enabledPlugins?: EnabledPlugins;
  alwaysThinkingEnabled?: boolean;
  // Allow any future fields
  [key: string]: unknown;
}

export interface ClaudePermissions {
  allow?: string[];
  deny?: string[];
}

export interface McpServerConfig {
  type?: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

export interface ClaudeHook {
  type?: 'user-prompt' | 'ai-response';
  command?: string;
  description?: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ToolPatternListProps {
  patterns: string[];
  onChange: (patterns: string[]) => void;
  title: string;
  description: string;
}

export interface PermissionsEditorProps {
  permissions: ClaudePermissions;
  onChange: (permissions: ClaudePermissions) => void;
}

export interface McpServersEditorProps {
  mcpServers: Record<string, McpServerConfig>;
  onChange: (servers: Record<string, McpServerConfig>) => void;
}

export interface McpServerConfigProps {
  name: string;
  config: McpServerConfig;
  onChange: (config: McpServerConfig) => void;
  onDelete: () => void;
}

export interface HooksEditorProps {
  hooks: Record<string, ClaudeHook[]>;
  onChange: (hooks: Record<string, ClaudeHook[]>) => void;
}

export interface SettingsFormProps {
  settings: ClaudeSettings;
  onChange: (settings: ClaudeSettings) => void;
  activeSection: 'permissions' | 'mcp' | 'hooks' | 'env' | 'plugins' | 'advanced';
  onSectionChange: (section: 'permissions' | 'mcp' | 'hooks' | 'env' | 'plugins' | 'advanced') => void;
}

export interface SettingsJSONEditorProps {
  settings: ClaudeSettings;
  onChange: (settings: ClaudeSettings) => void;
}

export type EditorMode = 'form' | 'json';
