import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash,
  FloppyDisk,
  DownloadSimple,
  UploadSimple,
  FileText,
  WarningCircle,
  CheckCircle,
  Spinner,
  Code,
  Folder,
  CaretRight,
  CaretDown,
} from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { CodeEditor } from '@/renderer/components/CodeEditor';
import { TipTapEditor } from '@/renderer/components/TipTapEditor';
import { useAppStore } from '@/renderer/stores';
import { ipc } from '@/ipc/manager';
import { showError, showSuccess } from '@/renderer/lib/toast';
import {
  commandCreateSchema,
  type CommandCreateValues,
} from '@/schemas/claude';

interface CommandFile {
  name: string;
  path: string;
  content?: string;
  description?: string;
  isValid?: boolean;
  category?: string;
  isRootLevel?: boolean;
}

interface CommandFrontmatter {
  description?: string;
  [key: string]: any;
}

interface CommandGroup {
  category: string;
  commands: CommandFile[];
}

export const CommandsTab: React.FC = () => {
  const { selectedProjectId, isMainConfigSelected, currentView } = useAppStore();
  const [homePath, setHomePath] = useState<string>('');
  const [commands, setCommands] = useState<CommandFile[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));
  const [isAdding, setIsAdding] = useState(false);

  // Form for creating new command
  const createForm = useForm<CommandCreateValues>({
    resolver: zodResolver(commandCreateSchema),
    defaultValues: {
      name: 'my-command',
    },
  });

  // Get home path from main process
  useEffect(() => {
    const getHome = async () => {
      try {
        const home = await ipc.client.app.getHomePath();
        setHomePath(home);
      } catch (error) {
        console.error('Failed to get home path:', error);
      }
    };
    getHome();
  }, []);

  const currentPath = isMainConfigSelected
    ? homePath
    : selectedProjectId || '';

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
      result.unshift({ category: 'root', commands: rootCommands });
    }

    return result;
  }, [commands]);

  // Load commands from the selected project
  const loadCommands = useCallback(async () => {
    if (!currentPath) {
      console.log('No current path, skipping commands load');
      return;
    }

    console.log('Loading commands from:', currentPath);
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.client.claude.readClaudeDirectory({
        projectPath: currentPath,
        type: 'commands',
      });

      console.log('Commands result:', result);

      const loadedCommands: CommandFile[] = result.files.map((file) => {
        let commandData: CommandFile = {
          name: file.name,
          path: file.path,
          content: file.content || '',
        };

        if (file.category) {
          commandData.category = file.category;
        } else {
          commandData.isRootLevel = true;
        }

        if (file.content) {
          const frontmatterMatch = file.content.match(/^---\n([\s\S]*?)\n---/);
          if (frontmatterMatch) {
            try {
              const descMatch = frontmatterMatch[1].match(/description:\s*(.+)$/m);
              if (descMatch) {
                commandData.description = descMatch[1].trim().replace(/^["']|["']$/g, '');
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
      setExpandedGroups(new Set(['all', ...loadedCommands.map((c) => c.category || 'root').filter(Boolean)]));
    } catch (error) {
      console.error('Failed to load commands:', error);
      setError(error instanceof Error ? error.message : 'Failed to load commands');
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Reload when switching to this tab or when path changes
  useEffect(() => {
    if (currentView === 'commands') {
      loadCommands();
    }
  }, [currentView, loadCommands]);

  const selectedCommandData = commands.find((c) => c.name === selectedCommand);

  // Parse command content into frontmatter and body
  const parseCommand = (content: string): { frontmatter: string | null; body: string; hasFrontmatter: boolean } => {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      return { frontmatter: frontmatterMatch[1], body: frontmatterMatch[2], hasFrontmatter: true };
    }
    return { frontmatter: null, body: content, hasFrontmatter: false };
  };

  const { frontmatter, body, hasFrontmatter } = selectedCommandData?.content
    ? parseCommand(selectedCommandData.content)
    : { frontmatter: null, body: '', hasFrontmatter: false };

  // Validate command structure
  const validateCommand = (content: string): { valid: boolean; error?: string } => {
    if (!content.trim()) {
      return { valid: false, error: 'Command content cannot be empty' };
    }

    const hasFrontmatter = content.match(/^---\n[\s\S]*?\n---/);
    if (!hasFrontmatter) {
      return { valid: false, error: 'Command must have YAML frontmatter (---) with description' };
    }

    if (!content.includes('$ARGUMENTS')) {
      return { valid: false, error: 'Command should include $ARGUMENTS placeholder for user arguments' };
    }

    return { valid: true };
  };

  const handleSave = async () => {
    if (!selectedCommandData) return;

    const fullContent = frontmatter
      ? `---\n${frontmatter}\n---\n${body}`
      : body;

    const validation = validateCommand(fullContent);
    if (!validation.valid) {
      setValidationErrors({ [selectedCommandData.name]: validation.error || 'Invalid command' });
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
      showSuccess('Command saved successfully');
      await loadCommands();
    } catch (error) {
      showError('Failed to save command', error);
      setError(error instanceof Error ? error.message : 'Failed to save command');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCommandData) return;

    if (!confirm(`Are you sure you want to delete command "${selectedCommandData.name}"?`)) {
      return;
    }

    try {
      await ipc.client.claude.deleteClaudeItem({ itemPath: selectedCommandData.path });
      setSelectedCommand(null);
      await loadCommands();
      showSuccess('Command deleted successfully');
    } catch (error) {
      showError('Failed to delete command', error);
      setError(error instanceof Error ? error.message : 'Failed to delete command');
    }
  };

  const handleAdd = () => {
    if (!currentPath) return;
    setIsAdding(true);
    createForm.setValue('name', `my-command-${commands.length + 1}`);
  };

  const handleConfirmAdd = async (values: CommandCreateValues) => {
    if (!currentPath) return;

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
      showSuccess('Command created successfully');
    } catch (error) {
      showError('Failed to create command', error);
      setError(error instanceof Error ? error.message : 'Failed to create command');
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    createForm.reset();
  };

  const handleExport = async () => {
    if (commands.length === 0) return;

    try {
      const exportData = commands.map((c) => ({
        name: c.name,
        content: c.content,
      }));
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commands-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export commands:', error);
      setError('Failed to export commands');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const importData = JSON.parse(content);

        if (!Array.isArray(importData)) {
          throw new Error('Invalid import format: expected an array of commands');
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
        console.error('Failed to import commands:', error);
        setError(error instanceof Error ? error.message : 'Failed to import commands');
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-semibold">Commands Management</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleImport} disabled={loading || commands.length === 0}>
            <UploadSimple className="h-4 w-4 mr-1" weight="regular" />
            Import
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={loading || commands.length === 0}>
            <DownloadSimple className="h-4 w-4 mr-1" weight="regular" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={loading || !currentPath}
            title={!currentPath ? "Select a project or global settings first" : "Add Command"}
            variant={!currentPath ? "outline" : "default"}
          >
            <Plus className="h-4 w-4" weight="regular" />
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-3">
          <WarningCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" weight="regular" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* No project selected */}
      {!currentPath && !loading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Select a project to manage commands</p>
        </div>
      )}

      {/* Main content */}
      {currentPath && (
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner className="h-6 w-6 animate-spin text-muted-foreground" weight="regular" />
            </div>
          ) : commands.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" weight="regular" />
              <p className="text-sm text-muted-foreground mb-4">No commands configured</p>
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" weight="regular" />
                Create Your First Command
              </Button>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Commands list - Grouped by category */}
              <div className="w-80 border-r overflow-y-auto">
                <div className="p-2">
                  {isAdding && (
                    <div className="p-2 rounded-md bg-primary/10 border border-primary/20 mb-2">
                      <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(handleConfirmAdd)} className="space-y-2">
                          <FormField
                            control={createForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} className="font-mono text-sm" autoFocus />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="flex-1">
                              Create
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={handleCancelAdd} className="flex-1">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                  {groupedCommands.map((group) => {
                    const isExpanded = expandedGroups.has(group.category);
                    return (
                      <div key={group.category} className="mb-2">
                        <button
                          onClick={() => toggleGroup(group.category)}
                          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                        >
                          {isExpanded ? (
                            <CaretDown className="h-4 w-4" weight="regular" />
                          ) : (
                            <CaretRight className="h-4 w-4" weight="regular" />
                          )}
                          <Folder className="h-4 w-4 text-muted-foreground" weight="regular" />
                          <span className="text-sm font-medium capitalize">
                            {group.category === 'root' ? 'Commands' : group.category}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {group.commands.length}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {group.commands.map((command) => {
                              const validationError = validationErrors[command.name];
                              const isValid = command.isValid !== false && !validationError;

                              return (
                                <div
                                  key={command.name}
                                  className={`p-2 rounded-md cursor-pointer transition-colors ${
                                    selectedCommand === command.name
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-muted'
                                  }`}
                                  onClick={() => setSelectedCommand(command.name)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <Code className="h-3 w-3 flex-shrink-0" weight="regular" />
                                        <span className="text-sm font-medium truncate">{command.name}</span>
                                        {isValid ? (
                                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" weight="regular" />
                                        ) : (
                                          <WarningCircle className="h-3 w-3 text-red-500 flex-shrink-0" weight="regular" />
                                        )}
                                      </div>
                                      <p className="text-xs opacity-70 mt-1 truncate">
                                        {command.description || 'No description'}
                                      </p>
                                    </div>
                                  </div>
                                  {validationError && (
                                    <p className="text-xs text-red-500 mt-1">{validationError}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Command editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedCommandData ? (
                  <>
                    {/* Editor header */}
                    <div className="p-4 border-b flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{selectedCommandData.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedCommandData.path.split('/').pop()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          <FloppyDisk className="h-4 w-4 mr-1" weight="regular" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDelete}
                        >
                          <Trash className="h-4 w-4 mr-1" weight="regular" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Editor - Split view with frontmatter and body */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {hasFrontmatter ? (
                        <div className="border-b overflow-hidden" style={{ height: '50%' }}>
                          <div className="px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                            Frontmatter (YAML)
                          </div>
                          <CodeEditor
                            value={frontmatter || ''}
                            onChange={(value) => {
                              if (value !== null && value !== undefined && selectedCommand) {
                                const newContent = `---\n${value}\n---\n${body}`;
                                setCommands(commands.map((c) => (c.name === selectedCommand ? { ...c, content: newContent } : c)));
                                setValidationErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[selectedCommandData.name];
                                  return next;
                                });
                              }
                            }}
                            language="yaml"
                            height="100%"
                          />
                        </div>
                      ) : (
                        <div className="border-b px-4 py-3 bg-muted/30 text-sm text-muted-foreground flex items-center justify-center" style={{ height: '50px' }}>
                          No frontmatter
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden">
                        <div className="px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                          Command Body (Markdown)
                        </div>
                        <TipTapEditor
                          content={body}
                          onChange={(value) => {
                            if (selectedCommand) {
                              const newContent = hasFrontmatter && frontmatter
                                ? `---\n${frontmatter}\n---\n${value}`
                                : value;
                              setCommands(commands.map((c) => (c.name === selectedCommand ? { ...c, content: newContent } : c)));
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
                          className="h-full"
                        />
                      </div>
                    </div>

                    {validationErrors[selectedCommandData.name] && (
                      <div className="p-3 bg-red-500/10 border-t border-red-500/20">
                        <p className="text-sm text-red-700 flex items-center gap-2">
                          <WarningCircle className="h-4 w-4" weight="regular" />
                          {validationErrors[selectedCommandData.name]}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a command to edit
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommandsTab;
