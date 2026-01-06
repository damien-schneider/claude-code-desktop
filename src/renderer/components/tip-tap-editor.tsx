import type React from "react";
import { cn } from "@/utils/tailwind";

interface MarkdownEditorProps {
  content: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export const TipTapEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  placeholder = "Write content here...",
  editable = true,
  className,
  actions,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-md border",
        className
      )}
    >
      <textarea
        className="min-h-[200px] flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed focus:outline-none"
        disabled={!editable}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        value={content}
      />
      {/* Floating action buttons */}
      {actions && (
        <div className="absolute right-4 bottom-4 shadow-lg">{actions}</div>
      )}
    </div>
  );
};

export default TipTapEditor;
