import type React from "react";
import DragWindowRegion from "@/components/drag-window-region";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion title="electron-shadcn" />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
