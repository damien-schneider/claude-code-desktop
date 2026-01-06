import React from 'react';
import { ToolPatternList } from './tool-pattern-list';
import type { PermissionsEditorProps } from './settings-types';

/**
 * Permissions editor for managing allowed/deny tool patterns
 */
export const PermissionsEditor: React.FC<PermissionsEditorProps> = ({
  permissions,
  onChange,
}) => {
  const handleAllowedChange = (patterns: string[]) => {
    onChange({ allow: patterns, deny: permissions.deny || [] });
  };

  const handleDeniedChange = (patterns: string[]) => {
    onChange({ allow: permissions.allow || [], deny: patterns });
  };

  return (
    <div className="space-y-6">
      <ToolPatternList
        patterns={permissions.allow || []}
        onChange={handleAllowedChange}
        title="Allowed Tools"
        description="Patterns for tools Claude can use. Empty = all tools allowed."
      />
      <ToolPatternList
        patterns={permissions.deny || []}
        onChange={handleDeniedChange}
        title="Denied Tools (Blocklist)"
        description="Patterns for tools Claude cannot use. Overrides allowed list."
      />
    </div>
  );
};
