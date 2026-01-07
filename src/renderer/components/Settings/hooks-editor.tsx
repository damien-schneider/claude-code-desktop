import { Plus, Trash } from "@phosphor-icons/react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ClaudeHook, HooksEditorProps } from "./settings-types";

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
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{eventName}</span>
          <Button onClick={onDelete} size="sm" variant="ghost">
            <Trash className="h-3 w-3" weight="regular" />
          </Button>
        </div>
        <Input
          className="font-mono text-sm"
          onChange={(e) => onChange({ ...hook, command: e.target.value })}
          placeholder="Command to run"
          value={hook.command || ""}
        />
        <Input
          className="text-sm"
          onChange={(e) => onChange({ ...hook, description: e.target.value })}
          placeholder="Description (optional)"
          value={hook.description || ""}
        />
      </CardContent>
    </Card>
  );
};

/**
 * Editor for Claude hooks configuration
 */
export const HooksEditor: React.FC<HooksEditorProps> = ({
  hooks,
  onChange,
}) => {
  const _hookEvents = Object.keys(hooks || {});

  const addHook = (eventName: string) => {
    const currentHooks = hooks[eventName] || [];
    const newHook: ClaudeHook = {
      type: "user-prompt",
      command: "",
    };
    onChange({
      ...hooks,
      [eventName]: [...currentHooks, newHook],
    });
  };

  const updateHook = (
    eventName: string,
    index: number,
    updatedHook: ClaudeHook
  ) => {
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
    "user-prompt-submit",
    "ai-response-start",
    "ai-response-complete",
    "tool-use-start",
    "tool-use-complete",
  ];

  return (
    <div className="space-y-6">
      {availableHookEvents.map((eventName) => {
        const eventHooks = hooks[eventName] || [];
        return (
          <div key={eventName}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">{eventName}</h3>
              <Button
                onClick={() => addHook(eventName)}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-1 h-3 w-3" weight="regular" />
                Add Hook
              </Button>
            </div>
            {eventHooks.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">
                No hooks configured
              </p>
            ) : (
              <div className="space-y-2">
                {eventHooks.map((hook, i) => (
                  <HookConfigItem
                    eventName={eventName}
                    hook={hook}
                    key={i}
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
