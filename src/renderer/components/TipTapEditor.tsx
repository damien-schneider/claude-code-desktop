import React from 'react';
import { cn } from '@/utils/tailwind';

interface MarkdownEditorProps {
  content: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  hasChanges?: boolean;
  actions?: React.ReactNode;
}

export const TipTapEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  placeholder = 'Write content here...',
  editable = true,
  className,
  hasChanges = false,
  actions,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn('border rounded-md overflow-hidden flex flex-col relative', className)}>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={!editable}
        className="flex-1 min-h-[200px] p-4 resize-none focus:outline-none bg-transparent font-mono text-sm leading-relaxed"
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      />
      {/* Floating action buttons */}
      {actions && (
        <div className="absolute bottom-4 right-4 shadow-lg">
          {actions}
        </div>
      )}
    </div>
  );
};

export default TipTapEditor;
