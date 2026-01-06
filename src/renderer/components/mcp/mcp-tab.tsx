import { Database, Plus, Spinner } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { McpConfig, McpServerConfig } from "@/ipc/claude/handlers";
import { ipc } from "@/ipc/manager";
import { activePathAtom } from "@/renderer/stores";
import { McpServerCard } from "./mcp-server-card";
import { McpServerForm } from "./mcp-server-form";

type ViewMode = "list" | "add" | "edit";

interface EditingServer {
  name: string;
  config: McpServerConfig;
}

/**
 * MCP Tab - Manage .mcp.json configuration
 */
export const McpTab: React.FC = () => {
  const [activePath] = useAtom(activePathAtom);
  const [mcpConfig, setMcpConfig] = useState<McpConfig>({ mcpServers: {} });
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingServer, setEditingServer] = useState<EditingServer | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load .mcp.json when activePath changes
  useEffect(() => {
    if (!activePath) {
      setMcpConfig({ mcpServers: {} });
      return;
    }

    const loadMcpConfig = async () => {
      setLoading(true);
      try {
        const config = await ipc.client.claude.readMcpConfig({
          projectPath: activePath,
        });
        setMcpConfig(config);
      } catch (error) {
        console.error("Failed to load MCP config:", error);
        setMcpConfig({ mcpServers: {} });
      } finally {
        setLoading(false);
      }
    };

    loadMcpConfig();
  }, [activePath]);

  const handleSaveConfig = async () => {
    if (!activePath) return;

    setSaving(true);
    try {
      const result = await ipc.client.claude.writeMcpConfig({
        projectPath: activePath,
        config: mcpConfig,
      });

      if (!result.success) {
        console.error("Failed to save MCP config:", result.error);
      }
    } catch (error) {
      console.error("Failed to save MCP config:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddServer = (name: string, config: McpServerConfig) => {
    const newConfig = {
      ...mcpConfig,
      mcpServers: {
        ...mcpConfig.mcpServers,
        [name]: config,
      },
    };
    setMcpConfig(newConfig);
    handleSaveConfig();
    setViewMode("list");
  };

  const handleEditServer = (name: string, config: McpServerConfig) => {
    const newConfig = {
      ...mcpConfig,
      mcpServers: {
        ...mcpConfig.mcpServers,
        [name]: config,
      },
    };
    setMcpConfig(newConfig);
    handleSaveConfig();
    setViewMode("list");
  };

  const handleDeleteServer = async (name: string) => {
    const { [name]: _, ...rest } = mcpConfig.mcpServers;
    const newConfig = { ...mcpConfig, mcpServers: rest };
    setMcpConfig(newConfig);
    await handleSaveConfig();
  };

  const handleStartEdit = (name: string) => {
    setEditingServer({ name, config: mcpConfig.mcpServers[name] });
    setViewMode("edit");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Spinner
            className="mx-auto mb-2 h-8 w-8 animate-spin"
            weight="regular"
          />
          <p className="text-muted-foreground text-sm">
            Loading MCP configuration...
          </p>
        </div>
      </div>
    );
  }

  if (!activePath) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Database
            className="mx-auto mb-3 h-12 w-12 opacity-50"
            weight="regular"
          />
          <p className="text-muted-foreground">
            Select a project or workspace to manage MCP servers
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === "add") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <h3 className="font-semibold">Add MCP Server</h3>
        </div>
        <div className="flex-1 p-4">
          <McpServerForm
            onCancel={() => setViewMode("list")}
            onSave={handleAddServer}
          />
        </div>
      </div>
    );
  }

  if (viewMode === "edit" && editingServer) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <h3 className="font-semibold">
            Edit MCP Server: {editingServer.name}
          </h3>
        </div>
        <div className="flex-1 p-4">
          <McpServerForm
            initialConfig={editingServer.config}
            onCancel={() => setViewMode("list")}
            onSave={(name, config) => handleEditServer(name, config)}
            serverName={editingServer.name}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background p-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" weight="regular" />
          <div>
            <h3 className="font-semibold">MCP Servers</h3>
          </div>
        </div>
        <Button onClick={() => setViewMode("add")} size="sm">
          <Plus className="mr-1 h-4 w-4" weight="regular" />
          Add Server
        </Button>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-auto p-4">
        {Object.keys(mcpConfig.mcpServers).length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No MCP servers configured
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(mcpConfig.mcpServers).map(([name, config]) => (
              <McpServerCard
                config={config}
                key={name}
                name={name}
                onDelete={() => handleDeleteServer(name)}
                onEdit={() => handleStartEdit(name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
