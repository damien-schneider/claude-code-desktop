import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash, FloppyDisk, X } from '@phosphor-icons/react';
import type { McpServerConfig } from '@/ipc/claude/handlers';

interface McpServerFormProps {
  serverName?: string;
  initialConfig?: McpServerConfig;
  onSave: (name: string, config: McpServerConfig) => void;
  onCancel: () => void;
}

interface EnvVar {
  key: string;
  value: string;
}

/**
 * Form for adding/editing an MCP server
 */
export const McpServerForm: React.FC<McpServerFormProps> = ({
  serverName,
  initialConfig,
  onSave,
  onCancel,
}) => {
  const isEdit = !!serverName;
  const [name, setName] = useState(serverName || '');
  const [command, setCommand] = useState(initialConfig?.command || 'npx');
  const [args, setArgs] = useState(initialConfig?.args?.join(' ') || '-y package-name');
  const [envVars, setEnvVars] = useState<EnvVar[]>(
    initialConfig?.env
      ? Object.entries(initialConfig.env).map(([key, value]) => ({ key, value }))
      : []
  );

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a server name');
      return;
    }

    const config: McpServerConfig = {
      command: command.trim() || 'npx',
      args: args.split(' ').filter(Boolean),
    };

    // Only include env if there are non-empty entries
    const validEnv = envVars.filter((e) => e.key.trim());
    if (validEnv.length > 0) {
      config.env = validEnv.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }

    onSave(name.trim(), config);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="text-sm font-medium">Server Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-server"
          className="mt-1"
          disabled={isEdit}
        />
        {isEdit && (
          <p className="text-xs text-muted-foreground mt-1">Server name cannot be changed</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Command</label>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="npx"
          className="mt-1 font-mono text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Arguments</label>
        <Input
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          placeholder="-y package-name"
          className="mt-1 font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Space-separated arguments
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Environment Variables</label>
          <Button size="sm" variant="outline" onClick={handleAddEnvVar}>
            <Plus className="h-3 w-3 mr-1" weight="regular" />
            Add Variable
          </Button>
        </div>
        {envVars.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No environment variables</p>
        ) : (
          <div className="space-y-2">
            {envVars.map((env, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={env.key}
                  onChange={(e) => handleEnvVarChange(i, 'key', e.target.value)}
                  placeholder="KEY"
                  className="font-mono text-sm flex-1"
                />
                <span className="text-muted-foreground">=</span>
                <Input
                  value={env.value}
                  onChange={(e) => handleEnvVarChange(i, 'value', e.target.value)}
                  placeholder="value"
                  className="font-mono text-sm flex-1"
                />
                <Button size="sm" variant="ghost" onClick={() => handleRemoveEnvVar(i)}>
                  <Trash className="h-3 w-3" weight="regular" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" weight="regular" />
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <FloppyDisk className="h-4 w-4 mr-1" weight="regular" />
          {isEdit ? 'Update Server' : 'Add Server'}
        </Button>
      </div>
    </div>
  );
};
