import { useState, useEffect } from 'react';
import { Package, Plus, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { EnabledPlugins } from './settings-types';

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
  const [newPluginId, setNewPluginId] = useState('');

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
      setNewPluginId('');
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
            <Package className="mx-auto h-12 w-12 mb-3 opacity-50" weight="regular" />
            <p className="text-sm">
              No plugins configured. Click "Add Plugin" to get started.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2" role="list">
            {pluginEntries.map(([pluginId, enabled]) => (
              <li
                key={pluginId}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
                role="listitem"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Package className="h-5 w-5 text-muted-foreground" weight="regular" />
                  <span className="font-medium">{pluginId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      handleToggleChange(pluginId, checked)
                    }
                    aria-label={`Toggle ${pluginId}`}
                  />
                  <Button
                    onClick={() => handleRemovePlugin(pluginId)}
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${pluginId}`}
                  >
                    <Trash className="h-4 w-4 text-destructive" weight="regular" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add New Plugin */}
      <Card className="p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-plugin-id">New Plugin ID</Label>
            <Input
              id="new-plugin-id"
              value={newPluginId}
              onChange={(e) => setNewPluginId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddPlugin();
                }
              }}
              placeholder="plugin-name"
            />
          </div>
          <Button
            onClick={handleAddPlugin}
            disabled={!newPluginId.trim()}
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
