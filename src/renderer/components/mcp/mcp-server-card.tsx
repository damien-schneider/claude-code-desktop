import { HardDrives, Pencil, Trash } from "@phosphor-icons/react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { McpServerConfig } from "@/ipc/claude/handlers";

interface McpServerCardProps {
  name: string;
  config: McpServerConfig;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Display card for an MCP server
 */
export const McpServerCard: React.FC<McpServerCardProps> = ({
  name,
  config,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardContent className="">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <HardDrives
              className="h-4 w-4 shrink-0 text-muted-foreground"
              weight="regular"
            />
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-medium">{name}</h4>
              <p className="truncate font-mono text-muted-foreground text-sm">
                {config.command} {config.args.join(" ")}
              </p>
              {config.env && Object.keys(config.env).length > 0 && (
                <p className="mt-1 text-muted-foreground text-xs">
                  {Object.keys(config.env).length} environment variable(s)
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={onEdit} size="sm" variant="outline">
              <Pencil className="h-3 w-3" weight="regular" />
            </Button>
            <Button onClick={onDelete} size="sm" variant="destructive">
              <Trash className="h-3 w-3" weight="regular" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
