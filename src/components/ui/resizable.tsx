"use client";

import * as React from "react";
import {
  Group,
  type PanelImperativeHandle,
  Panel as PanelPrimitive,
  Separator,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      className={cn(
        "flex h-full w-full data-[orientation=vertical]:flex-col",
        className
      )}
      data-slot="resizable-panel-group"
      {...props}
    />
  );
}

const ResizablePanel = React.forwardRef<
  PanelImperativeHandle,
  React.ComponentProps<typeof PanelPrimitive> & {
    onCollapse?: () => void;
    onExpand?: () => void;
  }
>(({ className, onCollapse, onExpand, onResize, ...props }, ref) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleResize = (
    panelSize: { asPercentage: number; inPixels: number },
    id: string | number | undefined,
    prevPanelSize: { asPercentage: number; inPixels: number } | undefined
  ) => {
    onResize?.(panelSize, id, prevPanelSize);

    const collapsedSize =
      typeof props.collapsedSize === "string"
        ? Number.parseFloat(props.collapsedSize)
        : (props.collapsedSize ?? 0);

    // Use pixels for collapse detection since collapsedSize is specified in pixels
    const isNowCollapsed = panelSize.inPixels <= collapsedSize + 5; // 5px tolerance

    if (isNowCollapsed && !isCollapsed) {
      setIsCollapsed(true);
      onCollapse?.();
    } else if (!isNowCollapsed && isCollapsed) {
      setIsCollapsed(false);
      onExpand?.();
    }
  };

  return (
    <PanelPrimitive
      className={cn(className)}
      data-slot="resizable-panel"
      onResize={handleResize}
      panelRef={ref}
      {...props}
    />
  );
});
ResizablePanel.displayName = "ResizablePanel";

function ResizableHandle({
  withHandle = true,
  variant = "default",
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
  variant?: "default" | "old";
}) {
  if (variant === "default") {
    return (
      <Separator
        className={cn(
          "group relative -mx-1 flex w-2 cursor-col-resize items-center justify-center focus-visible:outline-hidden data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=horizontal]:cursor-row-resize data-[orientation=vertical]:after:left-0 [&[data-orientation=vertical]>div]:rotate-90",
          className
        )}
        data-slot="resizable-handle"
        {...props}
      >
        {withHandle && (
          <div className="z-10 flex h-6 w-1 shrink-0 rounded-full bg-border transition-all duration-300 group-hover:h-12 group-hover:bg-primary" />
        )}
      </Separator>
    );
  }
  return (
    <Separator
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:translate-x-0 data-[orientation=vertical]:after:-translate-y-1/2 [&[data-orientation=vertical]>div]:rotate-90",
        className
      )}
      data-slot="resizable-handle"
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-border" />
      )}
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
