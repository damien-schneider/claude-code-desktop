import type React from "react";
import { Button } from "@/components/ui/button";
import type { EditorMode } from "./settings-types";

interface ModeToggleProps {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
}

/**
 * Toggle between Form and JSON editing modes
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex inline-flex items-center gap-2 rounded-md bg-muted p-1">
      <Button
        className="flex-1"
        onClick={() => onChange("form")}
        size="sm"
        variant={mode === "form" ? "default" : "ghost"}
      >
        Form
      </Button>
      <Button
        className="flex-1"
        onClick={() => onChange("json")}
        size="sm"
        variant={mode === "json" ? "default" : "ghost"}
      >
        JSON
      </Button>
    </div>
  );
};
