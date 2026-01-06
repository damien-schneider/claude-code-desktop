import React, { useState } from 'react';
import { SettingsJSONEditorProps } from './settings-types';

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
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-[400px]">
        <textarea
          value={json}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-full font-mono text-sm p-4 border rounded-md bg-muted resize-none"
          spellCheck={false}
        />
      </div>
      {error && (
        <div className="mt-2 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};
