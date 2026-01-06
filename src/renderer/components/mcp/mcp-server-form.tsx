import { FloppyDisk, Plus, Trash, X } from "@phosphor-icons/react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { McpServerConfig } from "@/ipc/claude/handlers";

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
  const [name, setName] = useState(serverName || "");
  const [command, setCommand] = useState(initialConfig?.command || "npx");
  const [args, setArgs] = useState(
    initialConfig?.args?.join(" ") || "-y package-name"
  );
  const [envVars, setEnvVars] = useState<EnvVar[]>(
    initialConfig?.env
      ? Object.entries(initialConfig.env).map(([key, value]) => ({
          key,
          value,
        }))
      : []
  );

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleEnvVarChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a server name");
      return;
    }

    const config: McpServerConfig = {
      command: command.trim() || "npx",
      args: args.split(" ").filter(Boolean),
    };

    // Only include env if there are non-empty entries
    const validEnv = envVars.filter((e) => e.key.trim());
    if (validEnv.length > 0) {
      config.env = validEnv.reduce(
        (acc, { key, value }) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string>
      );
    }

    onSave(name.trim(), config);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <label className="font-medium text-sm">Server Name</label>
        <Input
          className="mt-1"
          disabled={isEdit}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-server"
          value={name}
        />
        {isEdit && (
          <p className="mt-1 text-muted-foreground text-xs">
            Server name cannot be changed
          </p>
        )}
      </div>

      <div>
        <label className="font-medium text-sm">Command</label>
        <Input
          className="mt-1 font-mono text-sm"
          onChange={(e) => setCommand(e.target.value)}
          placeholder="npx"
          value={command}
        />
      </div>

      <div>
        <label className="font-medium text-sm">Arguments</label>
        <Input
          className="mt-1 font-mono text-sm"
          onChange={(e) => setArgs(e.target.value)}
          placeholder="-y package-name"
          value={args}
        />
        <p className="mt-1 text-muted-foreground text-xs">
          Space-separated arguments
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-medium text-sm">Environment Variables</label>
          <Button onClick={handleAddEnvVar} size="sm" variant="outline">
            <Plus className="mr-1 h-3 w-3" weight="regular" />
            Add Variable
          </Button>
        </div>
        {envVars.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            No environment variables
          </p>
        ) : (
          <div className="space-y-2">
            {envVars.map((env, i) => (
              <div className="flex items-center gap-2" key={i}>
                <Input
                  className="flex-1 font-mono text-sm"
                  onChange={(e) => handleEnvVarChange(i, "key", e.target.value)}
                  placeholder="KEY"
                  value={env.key}
                />
                <span className="text-muted-foreground">=</span>
                <Input
                  className="flex-1 font-mono text-sm"
                  onChange={(e) =>
                    handleEnvVarChange(i, "value", e.target.value)
                  }
                  placeholder="value"
                  value={env.value}
                />
                <Button
                  onClick={() => handleRemoveEnvVar(i)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash className="h-3 w-3" weight="regular" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={onCancel} variant="outline">
          <X className="mr-1 h-4 w-4" weight="regular" />
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <FloppyDisk className="mr-1 h-4 w-4" weight="regular" />
          {isEdit ? "Update Server" : "Add Server"}
        </Button>
      </div>
    </div>
  );
};
