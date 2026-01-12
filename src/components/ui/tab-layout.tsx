"use client";

import type * as React from "react";
import {
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
  ResizableHandle as PanelResizeHandle,
} from "./resizable";

export interface TabLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  sidebarClassName?: string;
  mainClassName?: string;
  className?: string;
  sidebarDefaultSize?: number;
  sidebarMinSize?: number;
  sidebarMaxSize?: number;
  mainDefaultSize?: number | string;
  mainMinSize?: number | string;
}

export function TabLayout({
  sidebar,
  main,
  sidebarClassName = "py-2",
  mainClassName,
  className = "h-full",
  sidebarDefaultSize = 250,
  sidebarMinSize = 210,
  sidebarMaxSize = 350,
  mainDefaultSize = "75%",
  mainMinSize = "60%",
}: TabLayoutProps) {
  return (
    <PanelGroup className={className} orientation="horizontal">
      <Panel
        className={sidebarClassName}
        defaultSize={sidebarDefaultSize}
        maxSize={sidebarMaxSize}
        minSize={sidebarMinSize}
      >
        <div className="flex h-full flex-col rounded-2xl bg-background-2">
          {sidebar}
        </div>
      </Panel>
      <PanelResizeHandle />
      <Panel
        className={mainClassName}
        defaultSize={mainDefaultSize}
        minSize={mainMinSize}
      >
        {main}
      </Panel>
    </PanelGroup>
  );
}
