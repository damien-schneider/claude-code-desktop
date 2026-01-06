import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  PlusCircle,
  Trash,
  FloppyDisk,
  Download,
  Upload,
  Power,
  Prohibit,
  WarningCircle,
  CheckCircle,
  Spinner,
  Play,
} from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { CodeEditor } from "@/renderer/components/CodeEditor";
import { useAtom } from "jotai";
import {
  activePathAtom,
  homePathAtom,
  currentViewAtom,
} from "@/renderer/stores";
import { ipc } from "@/ipc/manager";
import { showError, showSuccess } from "@/renderer/lib/toast";
import {
  hookTypeSchema,
  hookJsonSchema,
  hookCreateSchema,
  type HookType,
  type HookJson,
  type HookCreateValues,
} from "@/schemas/claude";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { cn } from "@/utils/tailwind";

const HOOK_TYPES: HookType[] = [
  "SessionStart",
  "PromptSubmit",
  "ToolUse",
  "ToolOutput",
  "Response",
  "SessionEnd",
];

interface HookFile {
  name: string;
  path: string;
  content?: string;
  enabled?: boolean;
  hookType?: HookType;
  isValid?: boolean;
}

export const HooksTab: React.FC = () => {
  // Jotai atoms - no prop drilling needed!
  const [activePath] = useAtom(activePathAtom);
  const [homePath] = useAtom(homePathAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [, setHomePath] = useAtom(homePathAtom);

  // Local state
  const [hooks, setHooks] = useState<HookFile[]>([]);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [testingHook, setTestingHook] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form for creating new hook
  const createForm = useForm<HookCreateValues>({
    resolver: zodResolver(hookCreateSchema),
    defaultValues: {
      name: "my-sessionstart-hook",
      hookType: "SessionStart",
    },
  });

  // Get home path from main process
  useEffect(() => {
    const getHome = async () => {
      try {
        const home = await ipc.client.app.getHomePath();
        setHomePath(home);
      } catch (error) {
        console.error("Failed to get home path:", error);
      }
    };
    getHome();
  }, [setHomePath]);

  // Load hooks from the selected project
  const loadHooks = useCallback(async () => {
    if (!activePath) {
      console.log("No active path, skipping hooks load");
      return;
    }

    console.log("Loading hooks from:", activePath);
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.client.claude.readClaudeDirectory({
        projectPath: activePath,
        type: "hooks",
      });

      console.log("Hooks result:", result);

      const loadedHooks: HookFile[] = result.files.map((file) => {
        let hookData: HookFile = {
          name: file.name.replace(".json", ""),
          path: file.path,
          content: file.content || "",
        };

        // Parse JSON to extract metadata
        if (file.content) {
          try {
            const parsed: HookJson = JSON.parse(file.content);
            hookData.enabled = parsed.enabled ?? true;
            hookData.hookType = parsed.hookType;
            hookData.isValid = true;
          } catch {
            hookData.enabled = true;
            hookData.isValid = false;
          }
        }

        return hookData;
      });

      setHooks(loadedHooks);
    } catch (error) {
      console.error("Failed to load hooks:", error);
      setError(error instanceof Error ? error.message : "Failed to load hooks");
    } finally {
      setLoading(false);
    }
  }, [activePath]);

  // Reload when switching to this tab or when path changes
  useEffect(() => {
    if (currentView === "hooks") {
      loadHooks();
    }
  }, [currentView, loadHooks]);

  const selectedHookData = hooks.find((h) => h.name === selectedHook);

  // Validate hook JSON structure
  const validateHookJSON = (
    content: string,
  ): { valid: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(content);
      if (!parsed.hookType || !HOOK_TYPES.includes(parsed.hookType)) {
        return {
          valid: false,
          error: `Invalid hookType. Must be one of: ${HOOK_TYPES.join(", ")}`,
        };
      }
      if (
        !parsed.script &&
        !parsed.onStart &&
        !parsed.onSubmit &&
        !parsed.onToolUse &&
        !parsed.onToolOutput &&
        !parsed.onResponse &&
        !parsed.onEnd
      ) {
        return {
          valid: false,
          error:
            "Hook must have a script or at least one lifecycle method (onStart, onSubmit, etc.)",
        };
      }
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error ? e.message : "Invalid JSON",
      };
    }
  };

  const handleSave = async () => {
    if (!selectedHookData) return;

    const validation = validateHookJSON(selectedHookData.content || "{}");
    if (!validation.valid) {
      setValidationErrors({
        [selectedHookData.name]: validation.error || "Invalid JSON",
      });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await ipc.client.claude.writeClaudeFile({
        filePath: selectedHookData.path,
        content: selectedHookData.content || "{}",
      });
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[selectedHookData.name];
        return next;
      });
      showSuccess("Hook saved successfully");
      await loadHooks();
    } catch (error) {
      showError("Failed to save hook", error);
      setError(error instanceof Error ? error.message : "Failed to save hook");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedHookData) return;

    if (
      !confirm(
        `Are you sure you want to delete hook "${selectedHookData.name}"?`,
      )
    ) {
      return;
    }

    try {
      await ipc.client.claude.deleteClaudeItem({
        itemPath: selectedHookData.path,
      });
      setSelectedHook(null);
      await loadHooks();
      showSuccess("Hook deleted successfully");
    } catch (error) {
      showError("Failed to delete hook", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete hook",
      );
    }
  };

  const handleAdd = () => {
    if (!activePath) return;
    setIsAdding(true);
  };

  const handleConfirmAdd = async (values: HookCreateValues) => {
    if (!activePath) return;

    const { name, hookType } = values;

    const newHook: HookJson = {
      name,
      description: `My ${hookType} hook`,
      hookType,
      enabled: true,
      script: `// ${hookType} hook script
// This script runs when ${hookType} event occurs

console.log('${hookType} hook executed:', {
  context: typeof context !== 'undefined' ? context : 'N/A',
});`,
    };

    const fileName = `${name}.json`;
    const content = JSON.stringify(newHook, null, 2);

    try {
      const filePath = `${activePath}/.claude/hooks/${fileName}`;
      await ipc.client.claude.writeClaudeFile({
        filePath,
        content,
      });

      await loadHooks();
      setSelectedHook(name);
      setIsAdding(false);
      createForm.reset();
      showSuccess("Hook created successfully");
    } catch (error) {
      showError("Failed to create hook", error);
      setError(
        error instanceof Error ? error.message : "Failed to create hook",
      );
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    createForm.reset();
  };

  const handleToggleEnabled = async (hookName: string) => {
    const hook = hooks.find((h) => h.name === hookName);
    if (!hook || !hook.content) return;

    try {
      const parsed: HookJson = JSON.parse(hook.content);
      parsed.enabled = !parsed.enabled;

      await ipc.client.claude.writeClaudeFile({
        filePath: hook.path,
        content: JSON.stringify(parsed, null, 2),
      });

      await loadHooks();
    } catch (error) {
      console.error("Failed to toggle hook:", error);
      setError(
        error instanceof Error ? error.message : "Failed to toggle hook",
      );
    }
  };

  const handleExport = async () => {
    if (hooks.length === 0) return;

    try {
      const exportData = hooks.map((h) => ({
        name: h.name,
        content: h.content,
      }));
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hooks-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export hooks:", error);
      setError("Failed to export hooks");
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const importData = JSON.parse(content);

        if (!Array.isArray(importData)) {
          throw new Error("Invalid import format: expected an array of hooks");
        }

        const hooksDir = `${activePath}/.claude/hooks`;
        for (const hook of importData) {
          if (hook.name && hook.content) {
            const filePath = `${hooksDir}/${hook.name}.json`;
            await ipc.client.claude.writeClaudeFile({
              filePath,
              content: hook.content,
            });
          }
        }

        await loadHooks();
      } catch (error) {
        console.error("Failed to import hooks:", error);
        setError(
          error instanceof Error ? error.message : "Failed to import hooks",
        );
      }
    };
    input.click();
  };

  const handleTestHook = async () => {
    if (!selectedHookData) return;

    setTestingHook(selectedHookData.name);
    try {
      const parsed: HookJson = JSON.parse(selectedHookData.content || "{}");

      if (parsed.script) {
        try {
          new Function(parsed.script);
        } catch (e) {
          throw new Error(
            `Script syntax error: ${e instanceof Error ? e.message : "Unknown error"}`,
          );
        }
      }

      const methods = [
        "onStart",
        "onSubmit",
        "onToolUse",
        "onToolOutput",
        "onResponse",
        "onEnd",
      ] as const;
      for (const method of methods) {
        const methodValue = parsed[method as keyof typeof parsed];
        if (methodValue) {
          try {
            new Function(methodValue as string);
          } catch (e) {
            throw new Error(
              `${method} syntax error: ${e instanceof Error ? e.message : "Unknown error"}`,
            );
          }
        }
      }

      alert("Hook validation passed! The hook structure and syntax are valid.");
    } catch (error) {
      alert(
        `Hook validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setTestingHook(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-3">
          <WarningCircle
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
            weight="regular"
          />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* No project selected */}
      {!activePath && !loading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">
            Select a project to manage hooks
          </p>
        </div>
      )}

      {/* Main content */}
      {activePath && (
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 overflow-hidden"
        >
          {/* Hooks List */}
          <ResizablePanel
            defaultSize={25}
            minSize={15}
            maxSize={40}
            className="border-r bg-muted/30 min-w-[200px]"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                <Spinner
                  className="h-6 w-6 animate-spin text-muted-foreground"
                  weight="regular"
                />
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-2 space-y-1 flex-shrink-0">
                {/* Add Hook Button / Form */}
                {isAdding ? (
                  <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                    <Form {...createForm}>
                      <form
                        onSubmit={createForm.handleSubmit(handleConfirmAdd)}
                        className="space-y-2"
                      >
                        <FormField
                          control={createForm.control}
                          name="hookType"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  createForm.setValue(
                                    "name",
                                    `my-${value.toLowerCase()}-hook`,
                                  );
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select hook type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {HOOK_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="font-mono text-sm"
                                  autoFocus
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="flex-1">
                            Create
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCancelAdd}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                ) : (
                  <Button
                    onClick={handleAdd}
                    variant="ghost"
                    className="w-full p-3 border"
                  >
                    <PlusCircle className="h-5 w-5" weight="regular" />
                    <span className="text-sm font-medium">Add Hook</span>
                  </Button>
                )}
                </div>

                {/* Hooks List */}
                {hooks.length === 0 && !isAdding ? (
                  <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
                    <div className="text-center">
                      <WarningCircle
                        className="h-8 w-8 mx-auto mb-2 opacity-50"
                        weight="regular"
                      />
                      <p className="text-sm">No hooks configured</p>
                      <p className="text-xs mt-1">
                        Create hooks to customize behavior
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                  {hooks.map((hook) => {
                    const validationError = validationErrors[hook.name];
                    const isValid = hook.isValid !== false && !validationError;

                    return (
                      <div
                        key={hook.name}
                        className={cn(
                          "p-3 rounded-md cursor-pointer transition-colors",
                          selectedHook === hook.name
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted",
                        )}
                        onClick={() => setSelectedHook(hook.name)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {hook.name}
                              </span>
                              {isValid ? (
                                <CheckCircle
                                  className="h-3 w-3 text-green-500 flex-shrink-0"
                                  weight="regular"
                                />
                              ) : (
                                <WarningCircle
                                  className="h-3 w-3 text-red-500 flex-shrink-0"
                                  weight="regular"
                                />
                              )}
                            </div>
                            <span className="text-xs opacity-70">
                              {hook.hookType || "Unknown"}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEnabled(hook.name);
                            }}
                            className="flex-shrink-0 p-1 rounded hover:bg-background/20"
                            title={hook.enabled ? "Disable" : "Enable"}
                          >
                            {hook.enabled ? (
                              <Power
                                className="h-4 w-4 text-green-500"
                                weight="regular"
                              />
                            ) : (
                              <Prohibit
                                className="h-4 w-4 text-gray-500"
                                weight="regular"
                              />
                            )}
                          </button>
                        </div>
                        {validationError && (
                          <p className="text-xs text-red-500 mt-1">
                            {validationError}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Hook Editor */}
          <ResizablePanel defaultSize={75} minSize={60}>
            {selectedHookData ? (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                {/* Toolbar */}
                <div className="p-3 border-b bg-background flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleImport}
                      disabled={hooks.length === 0}
                    >
                      <Upload className="h-4 w-4 mr-1" weight="regular" />
                      Import
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExport}
                      disabled={hooks.length === 0}
                    >
                      <Download className="h-4 w-4 mr-1" weight="regular" />
                      Export
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTestHook}
                      disabled={testingHook === selectedHookData.name}
                    >
                      {testingHook === selectedHookData.name ? (
                        <Spinner
                          className="h-4 w-4 mr-1 animate-spin"
                          weight="regular"
                        />
                      ) : (
                        <Play className="h-4 w-4 mr-1" weight="regular" />
                      )}
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <FloppyDisk className="h-4 w-4 mr-1" weight="regular" />
                      {saving ? "Saving..." : "Save"}
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

                {/* Editor Content */}
                <div className="flex-1 overflow-auto">
                  <CodeEditor
                    value={selectedHookData.content || ""}
                    onChange={(value) => {
                      if (value !== undefined && selectedHook) {
                        setHooks(
                          hooks.map((h) =>
                            h.name === selectedHook
                              ? { ...h, content: value }
                              : h,
                          ),
                        );
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next[selectedHookData.name];
                          return next;
                        });
                      }
                    }}
                    language="json"
                    height="100%"
                  />
                </div>

                {/* Validation status */}
                {validationErrors[selectedHookData.name] && (
                  <div className="p-3 bg-red-500/10 border-t border-red-500/20">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <WarningCircle className="h-4 w-4" weight="regular" />
                      {validationErrors[selectedHookData.name]}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <WarningCircle
                    className="h-12 w-12 mx-auto mb-3 opacity-50"
                    weight="regular"
                  />
                  <p>Select a hook to edit</p>
                  <p className="text-sm mt-1">
                    Or create a new hook to get started
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default HooksTab;
