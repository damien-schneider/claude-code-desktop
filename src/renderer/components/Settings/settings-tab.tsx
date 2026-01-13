import { ArrowsClockwise, FloppyDisk } from "@phosphor-icons/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TipTapEditor } from "@/renderer/components/tip-tap-editor";

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = React.useState<{
    allowedTools: string[];
    modelPreferences: Record<string, string>;
    theme: "light" | "dark" | "system";
  }>({
    allowedTools: [],
    modelPreferences: {},
    theme: "system",
  });

  const [settingsJson, setSettingsJson] = React.useState(
    '{\n  "allowedTools": [],\n  "modelPreferences": {},\n  "theme": "system"\n}'
  );

  const handleSave = () => console.log("Saving settings...");
  const handleReload = () => console.log("Reloading settings...");

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Settings</h3>
        <div className="flex gap-2">
          <Button onClick={handleReload} size="sm" variant="outline">
            <ArrowsClockwise className="mr-1 h-4 w-4" weight="regular" />
            Reload
          </Button>
          <Button onClick={handleSave} size="sm">
            <FloppyDisk className="mr-1 h-4 w-4" weight="regular" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid h-[calc(100vh-200px)] grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">settings.json</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <TipTapEditor
              className="h-full"
              content={settingsJson}
              onChange={(value) => setSettingsJson(value || "")}
              placeholder="Edit your settings.json..."
              rawMode={true}
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
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="theme-select"
                >
                  Theme
                </label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  id="theme-select"
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      theme: e.target.value as "light" | "dark" | "system",
                    })
                  }
                  value={settings.theme}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <span className="mb-2 block font-medium text-sm">
                  Allowed Tools
                </span>
                <Card>
                  <CardContent className="min-h-[100px] p-3">
                    {settings.allowedTools.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No tools specified (all tools allowed)
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {settings.allowedTools.map((tool) => (
                          <div
                            className="flex items-center gap-2 text-sm"
                            key={tool}
                          >
                            <span className="rounded bg-muted px-2 py-1 font-mono text-xs">
                              {tool}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <span className="mb-2 block font-medium text-sm">
                  Model Preferences
                </span>
                <Card>
                  <CardContent className="min-h-[100px] p-3">
                    {Object.keys(settings.modelPreferences).length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No model preferences set
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(settings.modelPreferences).map(
                          ([key, value]) => (
                            <div className="text-sm" key={key}>
                              <span className="font-medium">{key}:</span>{" "}
                              {value}
                            </div>
                          )
                        )}
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
