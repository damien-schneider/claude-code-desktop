import Editor from "@monaco-editor/react";
import { FileCode } from "@phosphor-icons/react";
import type { editor } from "monaco-editor";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  theme?: "vs-dark" | "light" | "vs";
  readOnly?: boolean;
  height?: string | number;
  options?: editor.IStandaloneEditorConstructionOptions;
  showEmptyState?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = "markdown",
  theme = "vs-dark",
  readOnly = false,
  height = "100%",
  options = {},
  showEmptyState = false,
}) => {
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    // Configure default options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
      ...options,
    });
  };

  const isEmpty = !value || value.trim() === "";

  if (showEmptyState && isEmpty) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileCode
            className="mx-auto mb-3 h-12 w-12 opacity-50"
            weight="regular"
          />
          <p>No content to display</p>
          <p className="mt-1 text-sm">Create or select a file to edit</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="h-full p-0">
        <Editor
          defaultLanguage={language}
          height={height}
          language={language}
          loading={<div className="p-4 text-center">Loading editor...</div>}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            ...options,
          }}
          theme={theme}
          value={value}
        />
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
