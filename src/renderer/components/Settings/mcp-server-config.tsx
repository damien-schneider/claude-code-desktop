import { Plus, Trash } from "@phosphor-icons/react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { McpServerConfigProps } from "./settings-types";

/**
 * Individual MCP server configuration component
 */
export const McpServerConfig: React.FC<McpServerConfigProps> = ({
  name,
  config,
  onChange,
  onDelete,
}) => {
  const [envEntries, setEnvEntries] = useState<Record<string, string>>(
    config.env || {}
  );

  const handleCommandChange = (value: string) => {
    onChange({ ...config, command: value });
  };

  const handleArgsChange = (value: string) => {
    const args = value.split(" ").filter(Boolean);
    onChange({ ...config, args });
  };

  const handleEnvChange = (key: string, value: string) => {
    const newEnv = { ...envEntries, [key]: value };
    setEnvEntries(newEnv);
    onChange({ ...config, env: newEnv });
  };

  const handleAddEnvVar = () => {
    const key = `ENV_${Object.keys(envEntries).length + 1}`;
    handleEnvChange(key, "");
  };

  const handleRemoveEnvVar = (key: string) => {
    const newEnv = { ...envEntries };
    delete newEnv[key];
    setEnvEntries(newEnv);
    onChange({
      ...config,
      env: Object.keys(newEnv).length > 0 ? newEnv : undefined,
    });
  };

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{name}</h4>
          <Button onClick={onDelete} size="sm" variant="destructive">
            <Trash className="mr-1 h-3 w-3" weight="regular" />
            Remove
          </Button>
        </div>

        <div>
          <label className="font-medium text-sm" htmlFor="mcp-command">
            Command
          </label>
          <Input
            className="mt-1 font-mono text-sm"
            id="mcp-command"
            onChange={(e) => handleCommandChange(e.target.value)}
            placeholder="npx"
            value={config.command}
          />
        </div>

        <div>
          <label className="font-medium text-sm" htmlFor="mcp-args">
            Arguments
          </label>
          <Input
            className="mt-1 font-mono text-sm"
            id="mcp-args"
            onChange={(e) => handleArgsChange(e.target.value)}
            placeholder="-y package-name"
            value={(config.args ?? []).join(" ")}
          />
          <p className="mt-1 text-muted-foreground text-xs">
            Space-separated arguments
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-sm">Environment Variables</span>
            <Button
              onClick={handleAddEnvVar}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus className="mr-1 h-3 w-3" weight="regular" />
              Add Variable
            </Button>
          </div>
          {Object.keys(envEntries).length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              No environment variables
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(envEntries).map(([key, value]) => (
                <div className="flex items-center gap-2" key={key}>
                  <Input
                    className="flex-1 font-mono text-sm"
                    onChange={(e) => {
                      const newEnv = { ...envEntries };
                      delete newEnv[key];
                      newEnv[e.target.value] = value;
                      setEnvEntries(newEnv);
                      onChange({ ...config, env: newEnv });
                    }}
                    placeholder="KEY"
                    value={key}
                  />
                  <span className="text-muted-foreground">=</span>
                  <Input
                    className="flex-1 font-mono text-sm"
                    onChange={(e) => handleEnvChange(key, e.target.value)}
                    placeholder="value"
                    value={value}
                  />
                  <Button
                    onClick={() => handleRemoveEnvVar(key)}
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
      </CardContent>
    </Card>
  );
};
