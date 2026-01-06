import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from '@phosphor-icons/react';
import type { ToolPatternListProps } from './settings-types';

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
  const [newPattern, setNewPattern] = useState('');

  const addPattern = () => {
    if (newPattern.trim()) {
      onChange([...patterns, newPattern.trim()]);
      setNewPattern('');
    }
  };

  const removePattern = (index: number) => {
    onChange(patterns.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Button size="sm" onClick={addPattern}>
          Add
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Input
        value={newPattern}
        onChange={(e) => setNewPattern(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addPattern();
          }
        }}
        placeholder='e.g., Bash(git:*), Edit'
        className="font-mono text-sm"
      />
      {patterns.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No patterns configured</p>
      ) : (
        <ul className="space-y-1">
          {patterns.map((pattern, i) => (
            <li key={i} className="flex items-center gap-2 group">
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1 font-mono">
                {pattern}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removePattern(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
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
