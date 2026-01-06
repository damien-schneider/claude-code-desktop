import React from 'react';
import { Brain } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { JsonFieldRenderer } from './json-field-renderer';

interface AdvancedSettingsEditorProps {
  settings: Record<string, unknown>;
  onChange: (settings: Record<string, unknown>) => void;
}

/**
 * Advanced Settings Editor - AI behavior and advanced configuration
 *
 * Displays advanced settings like:
 * - alwaysThinkingEnabled: Enable thinking mode for Claude
 * - Other AI behavior settings (auto-detected and rendered)
 */
export const AdvancedSettingsEditor: React.FC<AdvancedSettingsEditorProps> = ({
  settings,
  onChange,
}) => {
  const handleFieldChange = (key: string, value: unknown) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" weight="regular" />
          Advanced Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Always Thinking Enabled */}
        {settings.alwaysThinkingEnabled !== undefined && (
          <div className="flex items-center justify-between space-y-2 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="alwaysThinkingEnabled" className="font-medium">
                Always Thinking Enabled
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable extended thinking mode for Claude responses
              </p>
            </div>
            <Switch
              id="alwaysThinkingEnabled"
              checked={settings.alwaysThinkingEnabled as boolean}
              onCheckedChange={checked => handleFieldChange('alwaysThinkingEnabled', checked)}
            />
          </div>
        )}

        {/* Render other advanced settings using JsonFieldRenderer */}
        {Object.entries(settings)
          .filter(([key]) => key !== 'alwaysThinkingEnabled')
          .map(([key, value]) => (
            <JsonFieldRenderer
              key={key}
              fieldKey={key}
              value={value}
              onChange={newValue => handleFieldChange(key, newValue)}
            />
          ))}
      </CardContent>
    </Card>
  );
};
