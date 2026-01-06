import { Plus } from "@phosphor-icons/react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { McpServerConfig } from "./mcp-server-config";
import type { McpServersEditorProps } from "./settings-types";

/**
 * Editor for MCP servers configuration
 */
export const McpServersEditor: React.FC<McpServersEditorProps> = ({
  mcpServers,
  onChange,
}) => {
  const [servers, setServers] = useState<
    Record<string, import("./settings-types").McpServerConfig>
  >(mcpServers || {});

  const addServer = () => {
    const name = `server-${Object.keys(servers).length + 1}`;
    const newServers = {
      ...servers,
      [name]: { command: "npx", args: ["-y", "package-name"] },
    };
    setServers(newServers);
    onChange(newServers);
  };

  const handleServerChange = (
    name: string,
    config: import("./settings-types").McpServerConfig
  ) => {
    const newServers = { ...servers, [name]: config };
    setServers(newServers);
    onChange(newServers);
  };

  const handleServerDelete = (name: string) => {
    const { [name]: _, ...rest } = servers;
    setServers(rest);
    onChange(rest);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">MCP Servers</h3>
          <p className="text-muted-foreground text-sm">
            Configure Model Context Protocol servers for Claude
          </p>
        </div>
        <Button onClick={addServer} size="sm">
          <Plus className="mr-1 h-4 w-4" weight="regular" />
          Add Server
        </Button>
      </div>

      {Object.keys(servers).length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          No MCP servers configured
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(servers).map(([name, config]) => (
            <McpServerConfig
              config={config}
              key={name}
              name={name}
              onChange={(updatedConfig) =>
                handleServerChange(name, updatedConfig)
              }
              onDelete={() => handleServerDelete(name)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
