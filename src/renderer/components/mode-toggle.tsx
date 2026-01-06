import { ChatCircleText, Gear } from "@phosphor-icons/react";
import { useAtom, useSetAtom } from "jotai";
import type React from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { type AppMode, appModeAtom, setAppModeAtom } from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

export interface ModeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Toggle between Settings Mode and Chat Mode
 * Keyboard shortcuts: Cmd+1 for Settings, Cmd+2 for Chat
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({ className, style }) => {
  const [appMode] = useAtom(appModeAtom);
  const setAppMode = useSetAtom(setAppModeAtom);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + 1 or 2
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          setAppMode("settings");
        } else if (e.key === "2") {
          e.preventDefault();
          setAppMode("chat");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setAppMode]);

  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md bg-muted p-1",
        className
      )}
      style={style}
    >
      <Button
        className="h-7 gap-1.5"
        onClick={() => handleModeChange("settings")}
        size="sm"
        variant={appMode === "settings" ? "default" : "ghost"}
      >
        <Gear className="h-3.5 w-3.5" weight="regular" />
        <span>Settings</span>
        <kbd className="ml-1 rounded bg-muted-foreground/20 px-1 py-0.5 font-mono text-[10px] text-muted-foreground/70">
          1
        </kbd>
      </Button>
      <Button
        className="h-7 gap-1.5"
        onClick={() => handleModeChange("chat")}
        size="sm"
        variant={appMode === "chat" ? "default" : "ghost"}
      >
        <ChatCircleText className="h-3.5 w-3.5" weight="regular" />
        <span>Chat</span>
        <kbd className="ml-1 rounded bg-muted-foreground/20 px-1 py-0.5 font-mono text-[10px] text-muted-foreground/70">
          2
        </kbd>
      </Button>
    </div>
  );
};

export default ModeToggle;
