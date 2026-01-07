import { Package, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { EnabledPlugins } from "./settings-types";

interface EnabledPluginsEditorProps {
  enabledPlugins: EnabledPlugins;
  onChange: (plugins: EnabledPlugins) => void;
}

/**
 * Component for editing enabled plugins
 *
 * Displays plugins as a list with toggle switches and allows adding/removing plugins
 */
export function EnabledPluginsEditor({
  enabledPlugins,
  onChange,
}: EnabledPluginsEditorProps) {
  const [newPluginId, setNewPluginId] = useState("");

  // Get sorted plugin entries
  const pluginEntries = Object.entries(enabledPlugins).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  /**
   * Handle toggle change for a plugin
   */
  const handleToggleChange = (pluginId: string, enabled: boolean) => {
    onChange({
      ...enabledPlugins,
      [pluginId]: enabled,
    });
  };

  /**
   * Handle adding a new plugin
   */
  const handleAddPlugin = () => {
    if (newPluginId.trim()) {
      onChange({
        ...enabledPlugins,
        [newPluginId.trim()]: true,
      });
      setNewPluginId("");
    }
  };

  /**
   * Handle removing a plugin
   */
  const handleRemovePlugin = (pluginId: string) => {
    const newPlugins = { ...enabledPlugins };
    delete newPlugins[pluginId];
    onChange(newPlugins);
  };

  return (
    <div className="space-y-4">
      {/* Plugin List */}
      <div className="space-y-2">
        {pluginEntries.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <Package
              className="mx-auto mb-3 h-12 w-12 opacity-50"
              weight="regular"
            />
            <p className="text-sm">
              No plugins configured. Click "Add Plugin" to get started.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {pluginEntries.map(([pluginId, enabled]) => (
              <li
                className="flex items-center justify-between rounded-lg border bg-card p-3"
                key={pluginId}
              >
                <div className="flex flex-1 items-center gap-3">
                  <Package
                    className="h-5 w-5 text-muted-foreground"
                    weight="regular"
                  />
                  <span className="font-medium">{pluginId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    aria-label={`Toggle ${pluginId}`}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      handleToggleChange(pluginId, checked)
                    }
                  />
                  <Button
                    aria-label={`Remove ${pluginId}`}
                    onClick={() => handleRemovePlugin(pluginId)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash
                      className="h-4 w-4 text-destructive"
                      weight="regular"
                    />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add New Plugin */}
      <Card className="p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-plugin-id">New Plugin ID</Label>
            <Input
              id="new-plugin-id"
              onChange={(e) => setNewPluginId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddPlugin();
                }
              }}
              placeholder="plugin-name"
              value={newPluginId}
            />
          </div>
          <Button
            disabled={!newPluginId.trim()}
            onClick={handleAddPlugin}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" weight="regular" />
            Add Plugin
          </Button>
        </div>
      </Card>
    </div>
  );
}
