import { GripVerticalIcon } from "lucide-react";
import * as React from "react";
import {
  Group,
  type PanelImperativeHandle,
  Panel as PanelPrimitive,
  Separator,
} from "react-resizable-panels";

import { cn } from "@/utils/tailwind";

const ResizablePanelGroup = ({
  className,
  direction,
  ...props
}: React.ComponentProps<typeof Group> & {
  direction?: React.ComponentProps<typeof Group>["orientation"];
}) => (
  <Group
    className={cn(
      "flex h-full w-full data-[orientation=vertical]:flex-col",
      className
    )}
    data-slot="resizable-panel-group"
    orientation={direction || props.orientation}
    {...props}
  />
);

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
  className,
  variant = "new",
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
  variant?: "new" | "classic";
}) {
  if (variant === "new") {
    return (
      <Separator
        className={cn(
          "group relative flex w-2 shrink-0 items-center justify-center transition-colors focus-visible:outline-hidden data-[orientation=vertical]:h-2 data-[orientation=vertical]:w-full data-[orientation=vertical]:[&>div]:rotate-90",
          "cursor-col-resize data-[orientation=vertical]:cursor-row-resize",
          className
        )}
        data-slot="resizable-handle"
        {...props}
      >
        {withHandle && (
          <div className="z-10 flex h-8 w-0.5 items-center justify-center rounded-full bg-accent transition-[height,background-color,width] duration-300 ease-out group-hover:h-16 group-hover:w-1 group-hover:bg-brand group-hover:bg-primary/80">
            {/* <GripVerticalIcon className="size-2.5" /> */}
          </div>
        )}
      </Separator>
    );
  }
  return (
    <Separator
      className={cn(
        "relative flex w-2 shrink-0 items-center justify-center bg-transparent transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border hover:after:bg-primary/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[orientation=vertical]:h-2 data-[orientation=vertical]:w-full data-[orientation=vertical]:after:inset-x-0 data-[orientation=vertical]:after:inset-y-auto data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-px data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:translate-x-0 data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:[&>div]:rotate-90",
        "cursor-col-resize data-[orientation=vertical]:cursor-row-resize",
        className
      )}
      data-slot="resizable-handle"
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border transition-colors hover:bg-accent hover:text-accent-foreground">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </Separator>
  );
}

export {
  ResizableHandle as PanelResizeHandle,
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
};

export type { PanelImperativeHandle as ImperativePanelHandle } from "react-resizable-panels";
