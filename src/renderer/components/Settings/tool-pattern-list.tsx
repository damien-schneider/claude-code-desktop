import { X } from "@phosphor-icons/react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ToolPatternListProps } from "./settings-types";

/**
 * Shared component for editing tool pattern lists (allowed/deny)
 * Used by both allowed and denied tool lists in PermissionsEditor
 */
export const ToolPatternList: React.FC<ToolPatternListProps> = ({
  patterns,
  onChange,
  title,
  description,
}) => {
  const [newPattern, setNewPattern] = useState("");

  const addPattern = () => {
    if (newPattern.trim()) {
      onChange([...patterns, newPattern.trim()]);
      setNewPattern("");
    }
  };

  const removePattern = (index: number) => {
    onChange(patterns.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Button onClick={addPattern} size="sm">
          Add
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
      <Input
        className="font-mono text-sm"
        onChange={(e) => setNewPattern(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addPattern();
          }
        }}
        placeholder="e.g., Bash(git:*), Edit"
        value={newPattern}
      />
      {patterns.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          No patterns configured
        </p>
      ) : (
        <ul className="space-y-1">
          {patterns.map((pattern, i) => (
            <li className="group flex items-center gap-2" key={i}>
              <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-sm">
                {pattern}
              </code>
              <Button
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removePattern(i)}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" weight="regular" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
