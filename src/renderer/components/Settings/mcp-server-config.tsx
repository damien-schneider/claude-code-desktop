import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash, Plus } from "@phosphor-icons/react";
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
    config.env || {},
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
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash className="h-3 w-3 mr-1" weight="regular" />
            Remove
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium">Command</label>
          <Input
            value={config.command}
            onChange={(e) => handleCommandChange(e.target.value)}
            placeholder="npx"
            className="mt-1 font-mono text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Arguments</label>
          <Input
            value={(config.args ?? []).join(" ")}
            onChange={(e) => handleArgsChange(e.target.value)}
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
          {Object.keys(envEntries).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No environment variables
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(envEntries).map(([key, value]) => (
                <div key={key} className="flex gap-2 items-center">
                  <Input
                    value={key}
                    onChange={(e) => {
                      const newEnv = { ...envEntries };
                      delete newEnv[key];
                      newEnv[e.target.value] = value;
                      setEnvEntries(newEnv);
                      onChange({ ...config, env: newEnv });
                    }}
                    placeholder="KEY"
                    className="font-mono text-sm flex-1"
                  />
                  <span className="text-muted-foreground">=</span>
                  <Input
                    value={value}
                    onChange={(e) => handleEnvChange(key, e.target.value)}
                    placeholder="value"
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveEnvVar(key)}
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
