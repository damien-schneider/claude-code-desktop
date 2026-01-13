import { Spinner } from "@phosphor-icons/react";
import type React from "react";

interface SessionStatusProps {
  activeProcessId: string | null;
  isStreaming: boolean;
  isThinking: boolean;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({
  activeProcessId,
  isStreaming,
  isThinking,
}) => {
  if (!(activeProcessId || isStreaming || isThinking)) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute -top-6 left-0 flex select-none items-center gap-2 px-1">
      {(isStreaming || (activeProcessId && isStreaming)) && (
        <div className="flex items-center gap-2">
          <Spinner className="h-3 w-3 animate-spin text-primary" />
          <span className="animate-pulse font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
            Claude is responding...
          </span>
        </div>
      )}
      {!isStreaming && isThinking && (
        <div className="flex items-center gap-2">
          <Spinner className="h-3 w-3 animate-spin text-primary" />
          <span className="animate-pulse font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
            Claude is thinking...
          </span>
        </div>
      )}
      {activeProcessId && !isStreaming && !isThinking && (
        <div className="flex items-center gap-2">
          <div className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="font-medium text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Claude Code active
          </span>
        </div>
      )}
    </div>
  );
};
