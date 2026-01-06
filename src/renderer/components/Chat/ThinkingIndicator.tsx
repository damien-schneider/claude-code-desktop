import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Brain } from "@phosphor-icons/react";
import { thinkingStartTimeAtom } from "@/renderer/stores/chatAtoms";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/utils/tailwind";

interface ThinkingIndicatorProps {
  className?: string;
}

/**
 * A component that displays a thinking indicator with duration
 * Uses the shared Shimmer component from ai-elements for animation
 */
export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  className,
}) => {
  const [thinkingStartTime] = useAtom(thinkingStartTimeAtom);
  const [duration, setDuration] = useState(0);

  // Update duration every second
  useEffect(() => {
    if (!thinkingStartTime) {
      setDuration(0);
      return;
    }

    // Initial calculation
    setDuration(Math.floor((Date.now() - thinkingStartTime) / 1000));

    // Update every second
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - thinkingStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [thinkingStartTime]);

  const getMessage = () => {
    if (duration < 3) {
      return "Thinking...";
    }
    if (duration < 10) {
      return `Thinking (${duration}s)...`;
    }
    return `Still thinking (${duration}s)...`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-muted-foreground text-sm py-3",
        className
      )}
    >
      <Brain className="h-4 w-4 animate-pulse" />
      <Shimmer duration={2}>{getMessage()}</Shimmer>
    </div>
  );
};

export default ThinkingIndicator;
