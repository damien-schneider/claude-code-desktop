import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash, Plus } from '@phosphor-icons/react';
import type { HooksEditorProps } from './settings-types';
import type { ClaudeHook } from './settings-types';

/**
 * Individual hook configuration item component
 */
const HookConfigItem: React.FC<{
  hook: ClaudeHook;
  onChange: (hook: ClaudeHook) => void;
  onDelete: () => void;
  eventName: string;
}> = ({ hook, onChange, onDelete, eventName }) => {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{eventName}</span>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash className="h-3 w-3" weight="regular" />
          </Button>
        </div>
        <Input
          value={hook.command || ''}
          onChange={(e) => onChange({ ...hook, command: e.target.value })}
          placeholder="Command to run"
          className="font-mono text-sm"
        />
        <Input
          value={hook.description || ''}
          onChange={(e) => onChange({ ...hook, description: e.target.value })}
          placeholder="Description (optional)"
          className="text-sm"
        />
      </CardContent>
    </Card>
  );
};

/**
 * Editor for Claude hooks configuration
 */
export const HooksEditor: React.FC<HooksEditorProps> = ({ hooks, onChange }) => {
  const hookEvents = Object.keys(hooks || {});

  const addHook = (eventName: string) => {
    const currentHooks = hooks[eventName] || [];
    const newHook: ClaudeHook = {
      type: 'user-prompt',
      command: '',
    };
    onChange({
      ...hooks,
      [eventName]: [...currentHooks, newHook],
    });
  };

  const updateHook = (eventName: string, index: number, updatedHook: ClaudeHook) => {
    const currentHooks = [...(hooks[eventName] || [])];
    currentHooks[index] = updatedHook;
    onChange({
      ...hooks,
      [eventName]: currentHooks,
    });
  };

  const deleteHook = (eventName: string, index: number) => {
    const currentHooks = (hooks[eventName] || []).filter((_, i) => i !== index);
    const updatedHooks: Record<string, ClaudeHook[]> = { ...hooks };
    if (currentHooks.length > 0) {
      updatedHooks[eventName] = currentHooks;
    } else {
      delete updatedHooks[eventName];
    }
    onChange(updatedHooks);
  };

  const availableHookEvents = [
    'user-prompt-submit',
    'ai-response-start',
    'ai-response-complete',
    'tool-use-start',
    'tool-use-complete',
  ];

  return (
    <div className="space-y-6">
      {availableHookEvents.map((eventName) => {
        const eventHooks = hooks[eventName] || [];
        return (
          <div key={eventName}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{eventName}</h3>
              <Button size="sm" variant="outline" onClick={() => addHook(eventName)}>
                <Plus className="h-3 w-3 mr-1" weight="regular" />
                Add Hook
              </Button>
            </div>
            {eventHooks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No hooks configured</p>
            ) : (
              <div className="space-y-2">
                {eventHooks.map((hook, i) => (
                  <HookConfigItem
                    key={i}
                    hook={hook}
                    eventName={eventName}
                    onChange={(updated) => updateHook(eventName, i, updated)}
                    onDelete={() => deleteHook(eventName, i)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
