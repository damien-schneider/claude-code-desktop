import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind";

// Top-level regex and functions for performance
const CAMEL_CASE_REGEX = /([A-Z])/g;
const UPPERCASE_FIRST_FN = (str: string) => str.toUpperCase();

/**
 * Permission mode type - can be any string for dynamic modes
 */
export type PermissionMode = string;

export interface PermissionModeSelectorProps {
  value: PermissionMode;
  onChange: (mode: PermissionMode) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Default mode descriptions for known Claude Code permission modes
 * These are used as fallbacks and for well-known modes
 */
const knownModeDescriptions: Record<
  string,
  { label: string; description: string; icon: string; warning?: string }
> = {
  default: {
    label: "Default",
    description: "Ask for tool permissions",
    icon: "🔐",
  },
  plan: {
    label: "Plan",
    description: "Read-only planning mode",
    icon: "📋",
  },
  acceptEdits: {
    label: "Auto-accept",
    description: "Auto-accept edit permissions",
    icon: "⚡",
  },
  bypassPermissions: {
    label: "Bypass",
    description: "Skip all permission checks",
    icon: "⚠️",
    warning: "Use with caution!",
  },
  delegate: {
    label: "Delegate",
    description: "Delegate mode for subagents",
    icon: "🤝",
  },
  dontAsk: {
    label: "Don't Ask",
    description: "Don't ask for permissions",
    icon: "🚫",
  },
};

/**
 * Generate a user-friendly label from a mode string
 */
function formatModeLabel(mode: string): string {
  // Convert camelCase or PascalCase to Title Case
  return mode
    .replace(CAMEL_CASE_REGEX, " $1")
    .replace(/^./, UPPERCASE_FIRST_FN)
    .trim();
}

/**
 * Generate an icon based on mode characteristics
 */
function getModeIcon(mode: string): string {
  const lowerMode = mode.toLowerCase();

  if (lowerMode.includes("bypass") || lowerMode.includes("danger")) {
    return "⚠️";
  }
  if (lowerMode.includes("plan")) {
    return "📋";
  }
  if (lowerMode.includes("accept") || lowerMode.includes("auto")) {
    return "⚡";
  }
  if (lowerMode.includes("delegate")) {
    return "🤝";
  }
  if (lowerMode.includes("dont") || lowerMode.includes("deny")) {
    return "🚫";
  }
  if (lowerMode.includes("default")) {
    return "🔐";
  }

  return "⚙️"; // Default gear icon for unknown modes
}

/**
 * Get description for a mode, with fallback for unknown modes
 */
function getModeInfo(mode: string): {
  label: string;
  description: string;
  icon: string;
  warning?: string;
} {
  if (knownModeDescriptions[mode]) {
    return knownModeDescriptions[mode];
  }

  // Generate fallback info for unknown modes
  const label = formatModeLabel(mode);
  const isDangerous =
    mode.toLowerCase().includes("bypass") ||
    mode.toLowerCase().includes("danger");

  return {
    label,
    description: `${label} mode`,
    icon: getModeIcon(mode),
    warning: isDangerous ? "Use with caution!" : undefined,
  };
}

/**
 * Permission mode selector for Claude Code sessions
 * Dynamically loads available modes from Claude CLI
 * Allows choosing between all available permission modes
 */
export const PermissionModeSelector: React.FC<PermissionModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const [availableModes, setAvailableModes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModes = async () => {
      try {
        const { ipc } = await import("@/ipc/manager");
        const result = await ipc.client.claudeProcess.getPermissionModes();
        setAvailableModes(result.modes || []);
      } catch (error) {
        console.error("[PermissionModeSelector] Failed to load modes:", error);
        // Fallback to known modes
        setAvailableModes(Object.keys(knownModeDescriptions));
      } finally {
        setLoading(false);
      }
    };

    loadModes();
  }, []);

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <span className="font-medium text-muted-foreground text-xs">
          Permission Mode
        </span>
        <div className="text-muted-foreground text-sm">Loading modes...</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="font-medium text-muted-foreground text-xs">
        Permission Mode
      </span>
      <div className="flex flex-wrap gap-2" role="group">
        {availableModes.map((mode) => {
          const info = getModeInfo(mode);
          const isSelected = value === mode;
          const isDangerous =
            mode.toLowerCase().includes("bypass") ||
            mode.toLowerCase().includes("danger");

          return (
            <Button
              aria-pressed={isSelected}
              className={cn(
                "h-auto min-w-[100px] flex-1 justify-start gap-2 px-3 py-2",
                isDangerous &&
                  isSelected &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                !isSelected && "hover:bg-accent"
              )}
              disabled={disabled}
              key={mode}
              onClick={() => onChange(mode)}
              size="sm"
              type="button"
              variant={isSelected ? "default" : "outline"}
            >
              <span className="text-lg">{info.icon}</span>
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">{info.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {info.description}
                </span>
                {info.warning && (
                  <span className="font-bold text-[9px] text-destructive">
                    {info.warning}
                  </span>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionModeSelector;
