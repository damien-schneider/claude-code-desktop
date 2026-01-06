import type React from "react";
import type { PermissionsEditorProps } from "./settings-types";
import { ToolPatternList } from "./tool-pattern-list";

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
        description="Patterns for tools Claude can use. Empty = all tools allowed."
        onChange={handleAllowedChange}
        patterns={permissions.allow || []}
        title="Allowed Tools"
      />
      <ToolPatternList
        description="Patterns for tools Claude cannot use. Overrides allowed list."
        onChange={handleDeniedChange}
        patterns={permissions.deny || []}
        title="Denied Tools (Blocklist)"
      />
    </div>
  );
};
