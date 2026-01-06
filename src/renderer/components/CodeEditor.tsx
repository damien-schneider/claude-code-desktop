import React from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent } from '@/components/ui/card';
import { FileCode } from '@phosphor-icons/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  theme?: 'vs-dark' | 'light' | 'vs';
  readOnly?: boolean;
  height?: string | number;
  options?: editor.IStandaloneEditorConstructionOptions;
  showEmptyState?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'markdown',
  theme = 'vs-dark',
  readOnly = false,
  height = '100%',
  options = {},
  showEmptyState = false,
}) => {
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    // Configure default options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      ...options,
    });
  };

  const isEmpty = !value || value.trim() === '';

  if (showEmptyState && isEmpty) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" weight="regular" />
          <p>No content to display</p>
          <p className="text-sm mt-1">Create or select a file to edit</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0 h-full">
        <Editor
          height={height}
          defaultLanguage={language}
          language={language}
          theme={theme}
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            ...options,
          }}
          loading={<div className="p-4 text-center">Loading editor...</div>}
        />
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
