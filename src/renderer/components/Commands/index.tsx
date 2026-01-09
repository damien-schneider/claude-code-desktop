import { zodResolver } from "@hookform/resolvers/zod";
import {
  CaretDown,
  CaretRight,
  CheckCircle,
  Code,
  DownloadSimple,
  FileText,
  FloppyDisk,
  Folder,
  Plus,
  Spinner,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAtom } from "jotai";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ipc } from "@/ipc/manager";
import { CodeEditor } from "@/renderer/components/code-editor";
import { TipTapEditor } from "@/renderer/components/tip-tap-editor";
import { showError, showSuccess } from "@/renderer/lib/toast";
import {
  currentViewAtom,
  homePathAtom,
  isGlobalSettingsSelectedAtom,
  selectedProjectIdAtom,
} from "@/renderer/stores";
import {
  type CommandCreateValues,
  commandCreateSchema,
} from "@/schemas/claude";

interface CommandFile {
  name: string;
  path: string;
  content?: string;
  description?: string;
  isValid?: boolean;
  category?: string;
  isRootLevel?: boolean;
}

interface CommandGroup {
  category: string;
  commands: CommandFile[];
}

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
const DESCRIPTION_REGEX = /description:\s*(.+)$/m;
const PARSED_COMMAND_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
const HAS_FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---/;

export const CommandsTab: React.FC = () => {
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const [isGlobalSettingsSelected] = useAtom(isGlobalSettingsSelectedAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [homePath] = useAtom(homePathAtom);
  const [commands, setCommands] = useState<CommandFile[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["all"])
  );
  const [isAdding, setIsAdding] = useState(false);

  // Form for creating new command
  const createForm = useForm<CommandCreateValues>({
    resolver: zodResolver(commandCreateSchema),
    defaultValues: {
      name: "my-command",
    },
  });

  const currentPath = isGlobalSettingsSelected
    ? homePath
    : selectedProjectId || "";

  // Toggle group expansion
  const toggleGroup = (category: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandFile[]> = {};
    const rootCommands: CommandFile[] = [];

    for (const cmd of commands) {
      if (cmd.category) {
        if (!groups[cmd.category]) {
          groups[cmd.category] = [];
        }
        groups[cmd.category].push(cmd);
      } else if (cmd.isRootLevel) {
        rootCommands.push(cmd);
      }
    }

    const result: CommandGroup[] = Object.entries(groups)
      .map(([category, cmds]) => ({ category, commands: cmds }))
      .sort((a, b) => a.category.localeCompare(b.category));

    if (rootCommands.length > 0) {
      result.unshift({ category: "root", commands: rootCommands });
    }

    return result;
  }, [commands]);

  // Load commands from the selected project
  const loadCommands = useCallback(async () => {
    if (!currentPath) {
      console.log("No current path, skipping commands load");
      return;
    }

    console.log("Loading commands from:", currentPath);
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.client.claude.readClaudeDirectory({
        projectPath: currentPath,
        type: "commands",
      });

      console.log("Commands result:", result);

      const loadedCommands: CommandFile[] = result.files.map((file) => {
        const commandData: CommandFile = {
          name: file.name,
          path: file.path,
          content: file.content || "",
        };

        if (file.category) {
          commandData.category = file.category;
        } else {
          commandData.isRootLevel = true;
        }

        if (file.content) {
          const frontmatterMatch = file.content.match(FRONTMATTER_REGEX);
          if (frontmatterMatch) {
            try {
              const descMatch = frontmatterMatch[1].match(DESCRIPTION_REGEX);
              if (descMatch) {
                commandData.description = descMatch[1]
                  .trim()
                  .replace(/^["']|["']$/g, "");
              }
              commandData.isValid = true;
            } catch {
              commandData.isValid = false;
            }
          } else {
            commandData.isValid = true;
          }
        }

        return commandData;
      });

      setCommands(loadedCommands);
      setExpandedGroups(
        new Set([
          "all",
          ...loadedCommands.map((c) => c.category || "root").filter(Boolean),
        ])
      );
    } catch (error) {
      console.error("Failed to load commands:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load commands"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Reload when switching to this tab or when path changes
  useEffect(() => {
    if (currentView === "commands") {
      loadCommands();
    }
  }, [currentView, loadCommands]);

  const selectedCommandData = commands.find((c) => c.name === selectedCommand);

  // Parse command content into frontmatter and body
  const parseCommand = (
    content: string
  ): { frontmatter: string | null; body: string; hasFrontmatter: boolean } => {
    const frontmatterMatch = content.match(PARSED_COMMAND_REGEX);
    if (frontmatterMatch) {
      return {
        frontmatter: frontmatterMatch[1],
        body: frontmatterMatch[2],
        hasFrontmatter: true,
      };
    }
    return { frontmatter: null, body: content, hasFrontmatter: false };
  };

  const { frontmatter, body, hasFrontmatter } = selectedCommandData?.content
    ? parseCommand(selectedCommandData.content)
    : { frontmatter: null, body: "", hasFrontmatter: false };

  // Validate command structure
  const validateCommand = (
    content: string
  ): { valid: boolean; error?: string } => {
    if (!content.trim()) {
      return { valid: false, error: "Command content cannot be empty" };
    }

    const hasFrontmatter = content.match(HAS_FRONTMATTER_REGEX);
    if (!hasFrontmatter) {
      return {
        valid: false,
        error: "Command must have YAML frontmatter (---) with description",
      };
    }

    if (!content.includes("$ARGUMENTS")) {
      return {
        valid: false,
        error:
          "Command should include $ARGUMENTS placeholder for user arguments",
      };
    }

    return { valid: true };
  };

  const handleSave = async () => {
    if (!selectedCommandData) {
      return;
    }

    const fullContent = frontmatter
      ? `---\n${frontmatter}\n---\n${body}`
      : body;

    const validation = validateCommand(fullContent);
    if (!validation.valid) {
      setValidationErrors({
        [selectedCommandData.name]: validation.error || "Invalid command",
      });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await ipc.client.claude.writeClaudeFile({
        filePath: selectedCommandData.path,
        content: fullContent,
      });
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[selectedCommandData.name];
        return next;
      });
      showSuccess("Command saved successfully");
      await loadCommands();
    } catch (error) {
      showError("Failed to save command", error);
      setError(
        error instanceof Error ? error.message : "Failed to save command"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCommandData) {
      return;
    }

    // biome-ignore lint/suspicious/noAlert: Legacy confirm usage
    const isConfirmed = window.confirm(
      `Are you sure you want to delete command "${selectedCommandData.name}"?`
    );
    if (!isConfirmed) {
      return;
    }

    try {
      await ipc.client.claude.deleteClaudeItem({
        itemPath: selectedCommandData.path,
      });
      setSelectedCommand(null);
      await loadCommands();
      showSuccess("Command deleted successfully");
    } catch (error) {
      showError("Failed to delete command", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete command"
      );
    }
  };

  const handleAdd = () => {
    if (!currentPath) {
      return;
    }
    setIsAdding(true);
    createForm.setValue("name", `my-command-${commands.length + 1}`);
  };

  const handleConfirmAdd = async (values: CommandCreateValues) => {
    if (!currentPath) {
      return;
    }

    const { name } = values;

    const newCommand = `---
description: My custom command
---

# ${name}

$ARGUMENTS

## Instructions

Add your command instructions here.

## Steps

1. First step
2. Second step
3. Third step
`;

    const fileName = `${name}.md`;

    try {
      const filePath = `${currentPath}/.claude/commands/${fileName}`;
      await ipc.client.claude.writeClaudeFile({
        filePath,
        content: newCommand,
      });

      await loadCommands();
      setSelectedCommand(name);
      setIsAdding(false);
      createForm.reset();
      showSuccess("Command created successfully");
    } catch (error) {
      showError("Failed to create command", error);
      setError(
        error instanceof Error ? error.message : "Failed to create command"
      );
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    createForm.reset();
  };

  const handleExport = () => {
    if (commands.length === 0) {
      return;
    }

    try {
      const exportData = commands.map((c) => ({
        name: c.name,
        content: c.content,
      }));
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `commands-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export commands:", error);
      setError("Failed to export commands");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }
      await processImport(file);
    };
    input.click();
  };

  const processImport = async (file: File) => {
    try {
      const content = await file.text();
      const importData = JSON.parse(content);

      if (!Array.isArray(importData)) {
        throw new Error("Invalid import format: expected an array of commands");
      }

      const commandsDir = `${currentPath}/.claude/commands`;
      for (const cmd of importData) {
        if (cmd.name && cmd.content) {
          const filePath = `${commandsDir}/${cmd.name}.md`;
          await ipc.client.claude.writeClaudeFile({
            filePath,
            content: cmd.content,
          });
        }
      }

      await loadCommands();
    } catch (error) {
      console.error("Failed to import commands:", error);
      setError(
        error instanceof Error ? error.message : "Failed to import commands"
      );
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between border-b bg-background p-4">
      <div className="flex items-center gap-2">
        <div>
          <h3 className="font-semibold">Commands Management</h3>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          disabled={loading || commands.length === 0}
          onClick={handleImport}
          size="sm"
          type="button"
          variant="outline"
        >
          <UploadSimple className="mr-1 h-4 w-4" weight="regular" />
          Import
        </Button>
        <Button
          disabled={loading || commands.length === 0}
          onClick={handleExport}
          size="sm"
          type="button"
          variant="outline"
        >
          <DownloadSimple className="mr-1 h-4 w-4" weight="regular" />
          Export
        </Button>
        <Button
          disabled={loading || !currentPath}
          onClick={handleAdd}
          size="sm"
          title={
            currentPath
              ? "Add Command"
              : "Select a project or global settings first"
          }
          type="button"
          variant={currentPath ? "default" : "outline"}
        >
          <Plus className="h-4 w-4" weight="regular" />
        </Button>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex h-full flex-col items-center justify-center">
      <FileText
        className="mb-4 h-12 w-12 text-muted-foreground"
        weight="regular"
      />
      <p className="mb-4 text-muted-foreground text-sm">
        No commands configured
      </p>
      <Button onClick={handleAdd} size="sm" type="button">
        <Plus className="mr-1 h-4 w-4" weight="regular" />
        Create Your First Command
      </Button>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-80 overflow-y-auto border-r">
      <div className="p-2">
        {isAdding && (
          <div className="mb-2 rounded-md border border-primary/20 bg-primary/10 p-2">
            <form
              className="space-y-2"
              onSubmit={createForm.handleSubmit(handleConfirmAdd)}
            >
              <Controller
                control={createForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoFocus
                      className="font-mono text-sm"
                      id="name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <div className="flex gap-2">
                <Button className="flex-1" size="sm" type="submit">
                  Create
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCancelAdd}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
        {groupedCommands.map((group) => {
          const isExpanded = expandedGroups.has(group.category);
          return (
            <div className="mb-2" key={group.category}>
              <button
                className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-muted/50"
                onClick={() => toggleGroup(group.category)}
                type="button"
              >
                {isExpanded ? (
                  <CaretDown className="h-4 w-4" weight="regular" />
                ) : (
                  <CaretRight className="h-4 w-4" weight="regular" />
                )}
                <Folder
                  className="h-4 w-4 text-muted-foreground"
                  weight="regular"
                />
                <span className="font-medium text-sm capitalize">
                  {group.category === "root" ? "Commands" : group.category}
                </span>
                <span className="ml-auto text-muted-foreground text-xs">
                  {group.commands.length}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-1 ml-4 space-y-1">
                  {group.commands.map((command) => {
                    const validationError = validationErrors[command.name];
                    const isValid =
                      command.isValid !== false && !validationError;

                    return (
                      <button
                        className={`w-full cursor-pointer rounded-md p-2 text-left transition-colors ${
                          selectedCommand === command.name
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        key={command.name}
                        onClick={() => setSelectedCommand(command.name)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Code
                                className="h-3 w-3 shrink-0"
                                weight="regular"
                              />
                              <span className="truncate font-medium text-sm">
                                {command.name}
                              </span>
                              {isValid ? (
                                <CheckCircle
                                  className="h-3 w-3 shrink-0 text-green-500"
                                  weight="regular"
                                />
                              ) : (
                                <WarningCircle
                                  className="h-3 w-3 shrink-0 text-red-500"
                                  weight="regular"
                                />
                              )}
                            </div>
                            <p className="mt-1 truncate text-xs opacity-70">
                              {command.description || "No description"}
                            </p>
                          </div>
                        </div>
                        {validationError && (
                          <p className="mt-1 text-red-500 text-xs">
                            {validationError}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEditor = () => {
    if (!selectedCommandData) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Select a command to edit
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Editor header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h4 className="font-medium">{selectedCommandData.name}</h4>
            <p className="text-muted-foreground text-xs">
              {selectedCommandData.path.split("/").pop()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={saving}
              onClick={handleSave}
              size="sm"
              type="button"
              variant="outline"
            >
              <FloppyDisk className="mr-1 h-4 w-4" weight="regular" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleDelete}
              size="sm"
              type="button"
              variant="destructive"
            >
              <Trash className="mr-1 h-4 w-4" weight="regular" />
              Delete
            </Button>
          </div>
        </div>

        {/* Editor - Split view with frontmatter and body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {hasFrontmatter ? (
            <div className="overflow-hidden border-b" style={{ height: "50%" }}>
              <div className="border-b bg-muted/50 px-4 py-2 font-medium text-muted-foreground text-xs">
                Frontmatter (YAML)
              </div>
              <CodeEditor
                height="100%"
                language="yaml"
                onChange={(value) => {
                  if (
                    value !== null &&
                    value !== undefined &&
                    selectedCommand
                  ) {
                    const newContent = `---\n${value}\n---\n${body}`;
                    setCommands(
                      commands.map((c) =>
                        c.name === selectedCommand
                          ? { ...c, content: newContent }
                          : c
                      )
                    );
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next[selectedCommandData.name];
                      return next;
                    });
                  }
                }}
                value={frontmatter || ""}
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center border-b bg-muted/30 px-4 py-3 text-muted-foreground text-sm"
              style={{ height: "50px" }}
            >
              No frontmatter
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <div className="border-b bg-muted/50 px-4 py-2 font-medium text-muted-foreground text-xs">
              Command Body (Markdown)
            </div>
            <TipTapEditor
              className="h-full"
              content={body}
              onChange={(value) => {
                if (selectedCommand) {
                  const newContent =
                    hasFrontmatter && frontmatter
                      ? `---\n${frontmatter}\n---\n${value}`
                      : value;
                  setCommands(
                    commands.map((c) =>
                      c.name === selectedCommand
                        ? { ...c, content: newContent }
                        : c
                    )
                  );
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[selectedCommandData.name];
                    return next;
                  });
                }
              }}
              placeholder="# Command Title

$ARGUMENTS

## Instructions

Add your command instructions here.
"
            />
          </div>
        </div>

        {validationErrors[selectedCommandData.name] && (
          <div className="border-red-500/20 border-t bg-red-500/10 p-3">
            <p className="flex items-center gap-2 text-red-700 text-sm">
              <WarningCircle className="h-4 w-4" weight="regular" />
              {validationErrors[selectedCommandData.name]}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Spinner
            className="h-6 w-6 animate-spin text-muted-foreground"
            weight="regular"
          />
        </div>
      );
    }

    if (commands.length === 0 && !isAdding) {
      return renderEmptyState();
    }

    return (
      <div className="flex h-full">
        {renderSidebar()}
        {renderEditor()}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      {renderHeader()}

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 flex items-start gap-3 rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <WarningCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            weight="regular"
          />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* No project selected */}
      {!(currentPath || loading) && (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Select a project to manage commands
          </p>
        </div>
      )}

      {/* Main content */}
      {currentPath && (
        <div className="flex-1 overflow-hidden">{renderMainContent()}</div>
      )}
    </div>
  );
};

export default CommandsTab;
