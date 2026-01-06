import React from 'react';
import { FloppyDisk, ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeEditor } from '@/renderer/components/CodeEditor';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = React.useState<{
    allowedTools: string[];
    modelPreferences: Record<string, string>;
    theme: 'light' | 'dark' | 'system';
  }>({
    allowedTools: [],
    modelPreferences: {},
    theme: 'system',
  });

  const [settingsJson, setSettingsJson] = React.useState('{\n  "allowedTools": [],\n  "modelPreferences": {},\n  "theme": "system"\n}');

  const handleSave = () => console.log('Saving settings...');
  const handleReload = () => console.log('Reloading settings...');

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Settings</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleReload}>
            <ArrowsClockwise className="h-4 w-4 mr-1" weight="regular" />
            Reload
          </Button>
          <Button size="sm" onClick={handleSave}>
            <FloppyDisk className="h-4 w-4 mr-1" weight="regular" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">settings.json</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <CodeEditor
              value={settingsJson}
              onChange={(value) => setSettingsJson(value || '')}
              language="json"
              height="100%"
            />
          </CardContent>
        </Card>

        <Card className="overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">Theme</label>
                <select
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'system' })}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Allowed Tools</label>
                <Card>
                  <CardContent className="p-3 min-h-[100px]">
                    {settings.allowedTools.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tools specified (all tools allowed)</p>
                    ) : (
                      <div className="space-y-1">
                        {settings.allowedTools.map((tool) => (
                          <div key={tool} className="text-sm flex items-center gap-2">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{tool}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Model Preferences</label>
                <Card>
                  <CardContent className="p-3 min-h-[100px]">
                    {Object.keys(settings.modelPreferences).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No model preferences set</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(settings.modelPreferences).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsTab;
