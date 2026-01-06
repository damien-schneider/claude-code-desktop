import type React from "react";
import { useState } from "react";
import type { SettingsJSONEditorProps } from "./settings-types";

/**
 * Monaco-based JSON editor for settings
 * Falls back to textarea if Monaco is not available
 */
export const SettingsJSONEditor: React.FC<SettingsJSONEditorProps> = ({
  settings,
  onChange,
}) => {
  const [json, setJson] = useState(JSON.stringify(settings, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setJson(value);
    try {
      const parsed = JSON.parse(value);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-[400px] flex-1">
        <textarea
          className="h-full w-full resize-none rounded-md border bg-muted p-4 font-mono text-sm"
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
          value={json}
        />
      </div>
      {error && (
        <div className="mt-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );
};
