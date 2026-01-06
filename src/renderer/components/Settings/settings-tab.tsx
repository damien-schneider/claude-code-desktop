import React, { useState, useEffect, useCallback } from 'react';
import { Gear, FloppyDisk, Spinner } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAtom } from 'jotai';
import { activePathAtom } from '@/renderer/stores';
import { ipc } from '@/ipc/manager';
import { SettingsForm } from './settings-form';
import { SettingsJSONEditor } from './settings-json-editor';
import { ModeToggle } from './mode-toggle';
import type { ClaudeSettings, EditorMode } from './settings-types';

/**
 * Settings Tab - Form and JSON editors for settings.json
 */
export const SettingsTab: React.FC = () => {
  const [activePath] = useAtom(activePathAtom);
  const [mode, setMode] = useState<EditorMode>('form');
  const [settings, setSettings] = useState<ClaudeSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'permissions' | 'mcp' | 'hooks' | 'env' | 'plugins' | 'advanced'>('permissions');

  // Load settings.json when activePath changes
  useEffect(() => {
    if (!activePath) {
      setSettings({});
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      try {
        const settingsPath = `${activePath}/.claude/settings.json`;
        const result = await ipc.client.claude.readFileContent({ filePath: settingsPath });
        if (result.exists && result.content) {
          const parsed = JSON.parse(result.content);
          setSettings(parsed);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSettings({});
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [activePath]);

  const handleSave = async () => {
    if (!activePath) return;

    setSaving(true);
    try {
      const settingsPath = `${activePath}/.claude/settings.json`;
      const result = await ipc.client.claude.writeFileContent({
        filePath: settingsPath,
        content: JSON.stringify(settings, null, 2),
      });

      if (result.success) {
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings:', result.error);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner className="h-8 w-8 animate-spin mx-auto mb-2" weight="regular" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!activePath) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Gear className="h-12 w-12 mx-auto mb-3 opacity-50" weight="regular" />
          <p className="text-muted-foreground">Select a project or workspace to edit settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gear className="h-5 w-5" weight="regular" />
          <div>
            <h3 className="font-semibold">Settings</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="h-4 w-4 mr-1 animate-spin" weight="regular" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDisk className="h-4 w-4 mr-1" weight="regular" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {mode === 'form' ? (
          <SettingsForm
            settings={settings}
            onChange={setSettings}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        ) : (
          <SettingsJSONEditor settings={settings} onChange={setSettings} />
        )}
      </div>
    </div>
  );
};
