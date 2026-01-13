import { Code } from "@phosphor-icons/react";
import { useAtomValue } from "jotai";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  currentSessionMessagesAtom,
  streamingMessageAtom,
} from "@/renderer/stores/chat-atoms";

interface DebugPanelProps {
  children?: React.ReactNode;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ children }) => {
  const messages = useAtomValue(currentSessionMessagesAtom);
  const streamingMessage = useAtomValue(streamingMessageAtom);

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-[50vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Raw Conversation Data</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto">
          <div>
            <h4 className="mb-1 font-medium text-muted-foreground text-xs">
              Messages ({messages.length})
            </h4>
            <pre className="max-h-[60vh] overflow-auto rounded bg-muted p-2 font-mono text-xs">
              {JSON.stringify(messages, null, 2)}
            </pre>
          </div>
          {streamingMessage && (
            <div>
              <h4 className="mb-1 font-medium text-muted-foreground text-xs">
                Streaming Message
              </h4>
              <pre className="max-h-40 overflow-auto rounded bg-muted p-2 font-mono text-xs">
                {streamingMessage}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const DebugPanelButton: React.FC = () => {
  return (
    <Button className="size-9 p-0" title="Toggle Debug Panel" variant="ghost">
      <Code className="size-4" />
    </Button>
  );
};
