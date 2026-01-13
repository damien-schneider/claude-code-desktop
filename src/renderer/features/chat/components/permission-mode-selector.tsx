import type React from "react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/tailwind";

// Top-level regex and functions for performance
const CAMEL_CASE_REGEX = /([A-Z])/g;
const FIRST_CHAR_REGEX = /^./;
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
    .replace(FIRST_CHAR_REGEX, UPPERCASE_FIRST_FN)
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
    return null;
  }

  const selectedInfo = getModeInfo(value);
  const isDangerous =
    value.toLowerCase().includes("bypass") ||
    value.toLowerCase().includes("danger");

  return (
    <Select
      disabled={disabled}
      onValueChange={(newValue) => {
        if (newValue !== null) {
          onChange(newValue);
        }
      }}
      value={value}
    >
      <SelectTrigger
        className={cn(
          "absolute -top-2 right-2 w-52 -translate-y-full",
          isDangerous &&
            "border-destructive/50 bg-destructive/10 hover:bg-destructive/20",
          className
        )}
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className="text-base">{selectedInfo.icon}</span>
            <span className="flex flex-col items-start gap-0.5">
              <span className="font-medium text-sm leading-none">
                {selectedInfo.label}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">
                {selectedInfo.description}
              </span>
              {selectedInfo.warning && (
                <span className="font-bold text-[9px] text-destructive leading-none">
                  {selectedInfo.warning}
                </span>
              )}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableModes.map((mode) => {
          const info = getModeInfo(mode);
          const isModeDangerous =
            mode.toLowerCase().includes("bypass") ||
            mode.toLowerCase().includes("danger");

          return (
            <SelectItem
              className={cn(
                isModeDangerous &&
                  "text-destructive hover:text-destructive focus:text-destructive"
              )}
              key={mode}
              value={mode}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{info.icon}</span>
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-medium text-sm leading-none">
                    {info.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {info.description}
                  </span>
                  {info.warning && (
                    <span className="font-bold text-[9px] text-destructive leading-none">
                      {info.warning}
                    </span>
                  )}
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default PermissionModeSelector;
