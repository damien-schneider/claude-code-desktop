"use client";

import { Sidebar as SidebarIcon } from "@phosphor-icons/react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { useAtom } from "jotai";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  leftSidebarCollapsedAtom,
  rightSidebarCollapsedAtom,
} from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_WIDTH = "20rem";
const SIDEBAR_WIDTH_ICON_ONLY = "4rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a Sidebar.");
  }
  return context;
}

// Global keyboard shortcut handler for sidebar toggle
let sidebarToggleFn: (() => void) | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    // Cmd/Ctrl + B to toggle sidebar
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      sidebarToggleFn?.();
    }
  });
}

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    side?: "left" | "right";
  }
>(
  (
    { defaultOpen = true, side = "left", className, children, ...props },
    ref
  ) => {
    const atomToUse =
      side === "left" ? leftSidebarCollapsedAtom : rightSidebarCollapsedAtom;
    const [sidebarCollapsed, setSidebarCollapsed] = useAtom(atomToUse);
    const [openMobile, setOpenMobile] = React.useState(false);

    const isMobile = React.useMemo(() => {
      // Simple check for mobile - could use a hook
      return typeof window !== "undefined" && window.innerWidth < 768;
    }, []);

    const setOpen = React.useCallback(
      (open: boolean) => {
        setSidebarCollapsed(!open);
      },
      [setSidebarCollapsed]
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile(!openMobile)
        : setSidebarCollapsed(!sidebarCollapsed);
    }, [
      isMobile,
      openMobile,
      sidebarCollapsed,
      setSidebarCollapsed,
      setOpenMobile,
    ]);

    // Register the toggle function globally for keyboard shortcut
    React.useEffect(() => {
      sidebarToggleFn = toggleSidebar;
      return () => {
        sidebarToggleFn = null;
      };
    }, [toggleSidebar]);

    const state = sidebarCollapsed ? "collapsed" : "expanded";

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open: !sidebarCollapsed,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, sidebarCollapsed, setOpen, isMobile, openMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          className={cn(
            "flex h-full flex-col bg-muted/30",
            side === "left" ? "border-r" : "border-l",
            state === "collapsed" ? "w-16" : "w-64",
            className
          )}
          data-state={state}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-2",
        state === "collapsed" && "p-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto",
        state === "collapsed" ? "p-1" : "p-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      className={cn("border-t p-4", state === "collapsed" && "p-2", className)}
      ref={ref}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarTitle = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return null;
  }

  return (
    <div
      className={cn("font-semibold text-base", className)}
      ref={ref}
      {...props}
    />
  );
});
SidebarTitle.displayName = "SidebarTitle";

const SidebarSubtitle = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return null;
  }

  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      ref={ref}
      {...props}
    />
  );
});
SidebarSubtitle.displayName = "SidebarSubtitle";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul className={cn("flex flex-col gap-1", className)} ref={ref} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    className={cn("group/menu-item relative", className)}
    ref={ref}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-foreground",
        active: "bg-primary text-primary-foreground hover:bg-primary",
      },
      size: {
        default: "h-9 text-sm",
        sm: "h-8 text-xs",
        lg: "h-10 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof sidebarMenuButtonVariants> & {
      asChild?: boolean;
      isActive?: boolean;
    }
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { state } = useSidebar();
    const Comp = asChild ? Slot : "button";

    // When collapsed, only show the first child (main icon)
    const displayChildren =
      state === "collapsed"
        ? Array.isArray(children)
          ? children[0]
          : children
        : children;

    return (
      <Comp
        className={cn(
          sidebarMenuButtonVariants({ variant, size }),
          state === "collapsed" && "justify-center px-2",
          isActive && "bg-primary text-primary-foreground hover:bg-primary",
          className
        )}
        data-state={isActive ? "active" : "inactive"}
        ref={ref}
        {...props}
      >
        {displayChildren}
      </Comp>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return null;
  }

  return (
    <button
      className={cn(
        "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-muted-foreground outline-none ring-offset-background transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 peer-hover/menu-button:text-foreground [&_svg]:size-3",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-1.5 right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 font-medium text-muted-foreground text-xs tabular-nums",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = false, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-md px-2",
        state === "collapsed" && "h-8 w-8 justify-center",
        className
      )}
      ref={ref}
      {...props}
    >
      {showIcon && (
        <div className="h-4 w-4 shrink-0 rounded-md bg-muted-foreground/20" />
      )}
      {state !== "collapsed" && (
        <div className="h-2 w-full flex-1 rounded-md bg-muted-foreground/20" />
      )}
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      className={cn(
        "mx-2 w-auto",
        state === "collapsed" ? "my-1" : "my-2",
        className
      )}
      ref={ref}
      {...props}
    >
      <div
        className={cn("h-px bg-border", state === "collapsed" && "mx-auto w-8")}
      />
    </div>
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        state === "collapsed" && "gap-0",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    asChild?: boolean;
  }
>(({ asChild = false, className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "flex h-8 items-center px-2 font-semibold text-muted-foreground text-xs",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div className={className} ref={ref} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => (
  <main
    className={cn("flex flex-1 flex-col bg-background", className)}
    ref={ref}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";

const SidebarInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <input
      className={cn(
        "h-8 w-full border-input bg-background px-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        state === "collapsed" && "h-8 w-8 px-2 text-center",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SidebarInput.displayName = "SidebarInput";

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      className={cn("h-7 w-7", className)}
      data-sidebar="trigger"
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      ref={ref}
      size="icon"
      variant="ghost"
      {...props}
    >
      <SidebarIcon className="h-4 w-4" weight="regular" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
  SidebarSubtitle,
  SidebarTitle,
  SidebarTrigger,
  useSidebar,
};
