import type { ComponentProps } from "react";
import { openExternalLink } from "@/actions/shell";
import { cn } from "@/utils/tailwind";

export default function ExternalLink({
  children,
  className,
  href,
  ...props
}: ComponentProps<"a">) {
  function open(event: React.MouseEvent) {
    event.preventDefault();
    if (!href) {
      return;
    }

    openExternalLink(href);
  }

  if (!href) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      className={cn("cursor-pointer underline", className)}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
      onClick={open}
    >
      {children}
    </a>
  );
}
