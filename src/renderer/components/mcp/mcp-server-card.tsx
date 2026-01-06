import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash, HardDrives } from "@phosphor-icons/react";
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
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <HardDrives className="h-4 w-4 flex-shrink-0 text-muted-foreground" weight="regular" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{name}</h4>
              <p className="text-sm text-muted-foreground font-mono truncate">
                {config.command} {config.args.join(" ")}
              </p>
              {config.env && Object.keys(config.env).length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Object.keys(config.env).length} environment variable(s)
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3 w-3" weight="regular" />
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash className="h-3 w-3" weight="regular" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
