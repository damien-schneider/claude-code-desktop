import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle,
  Download,
  FloppyDisk,
  Play,
  PlusCircle,
  Power,
  Prohibit,
  Spinner,
  Trash,
  Upload,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAtom } from "jotai";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ipc } from "@/ipc/manager";
import { CodeEditor } from "@/renderer/components/code-editor";
import { showError, showSuccess } from "@/renderer/lib/toast";
import {
  activePathAtom,
  currentViewAtom,
  homePathAtom,
} from "@/renderer/stores";
import {
  type HookCreateValues,
  type HookJson,
  type HookType,
  hookCreateSchema,
} from "@/schemas/claude";
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

interface HookListItemProps {
  hook: HookFile;
  selectedHook: string | null;
  validationError?: string;
  sidebarCollapsed: boolean;
  onSelect: (name: string) => void;
  onToggleEnabled: (name: string) => void;
}

const _HookListItem: React.FC<HookListItemProps> = ({
  hook,
  selectedHook,
  validationError,
  sidebarCollapsed,
  onSelect,
  onToggleEnabled,
}) => {
  const isValid = hook.isValid !== false && !validationError;

  return (
    <button
      className={cn(
        "cursor-pointer rounded-md p-3 transition-colors",
        selectedHook === hook.name
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted",
        sidebarCollapsed && "flex justify-center p-2"
      )}
      onClick={() => onSelect(hook.name)}
      title={sidebarCollapsed ? hook.name : undefined}
      type="button"
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2",
          sidebarCollapsed && "justify-center"
        )}
      >
        {sidebarCollapsed ? (
          <div className="relative">
            {isValid ? (
              <CheckCircle
                className="h-4 w-4 shrink-0 text-green-500"
                weight="regular"
              />
            ) : (
              <WarningCircle
                className="h-4 w-4 shrink-0 text-red-500"
                weight="regular"
              />
            )}
            {!hook.enabled && (
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-background bg-gray-500" />
            )}
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-sm">
                  {hook.name}
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
              <span className="text-xs opacity-70">
                {hook.hookType || "Unknown"}
              </span>
            </div>
            <button
              className="shrink-0 rounded p-1 hover:bg-background/20"
              onClick={(e) => {
                e.stopPropagation();
                onToggleEnabled(hook.name);
              }}
              title={hook.enabled ? "Disable" : "Enable"}
              type="button"
            >
              {hook.enabled ? (
                <Power className="h-4 w-4 text-green-500" weight="regular" />
              ) : (
                <Prohibit className="h-4 w-4 text-gray-500" weight="regular" />
              )}
            </button>
          </>
        )}
      </div>
    </button>
  );
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex tab component with state management - refactoring would require extracting custom hooks
export const HooksTab: React.FC = () => {
  // Jotai atoms - no prop drilling needed!
  const [activePath] = useAtom(activePathAtom);
  const [_homePath] = useAtom(homePathAtom);
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        const hookData: HookFile = {
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
    content: string
  ): { valid: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(content);
      if (!(parsed.hookType && HOOK_TYPES.includes(parsed.hookType))) {
        return {
          valid: false,
          error: `Invalid hookType. Must be one of: ${HOOK_TYPES.join(", ")}`,
        };
      }
      if (
        !(
          parsed.script ||
          parsed.onStart ||
          parsed.onSubmit ||
          parsed.onToolUse ||
          parsed.onToolOutput ||
          parsed.onResponse ||
          parsed.onEnd
        )
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
    if (!selectedHookData) {
      return;
    }

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
    if (!selectedHookData) {
      return;
    }

    if (
      // biome-ignore lint/suspicious/noAlert: Replacing with modal is out of scope for this task
      !confirm(
        `Are you sure you want to delete hook "${selectedHookData.name}"?`
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
        error instanceof Error ? error.message : "Failed to delete hook"
      );
    }
  };

  const handleAdd = () => {
    if (!activePath) {
      return;
    }
    setIsAdding(true);
  };

  const handleConfirmAdd = async (values: HookCreateValues) => {
    if (!activePath) {
      return;
    }

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
        error instanceof Error ? error.message : "Failed to create hook"
      );
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    createForm.reset();
  };

  const handleToggleEnabled = async (hookName: string) => {
    const hook = hooks.find((h) => h.name === hookName);
    if (!hook?.content) {
      return;
    }

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
        error instanceof Error ? error.message : "Failed to toggle hook"
      );
    }
  };

  const handleExport = () => {
    if (hooks.length === 0) {
      return;
    }

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

      await processImportFile(file);
    };
    input.click();
  };

  const processImportFile = async (file: File) => {
    try {
      const content = await file.text();
      const importData = JSON.parse(content);

      if (!Array.isArray(importData)) {
        throw new Error("Invalid import format: expected an array of hooks");
      }

      await writeImportedHooks(importData);
      await loadHooks();
    } catch (error) {
      console.error("Failed to import hooks:", error);
      setError(
        error instanceof Error ? error.message : "Failed to import hooks"
      );
    }
  };

  const writeImportedHooks = async (importData: unknown[]) => {
    const hooksDir = `${activePath}/.claude/hooks`;
    for (const hook of importData) {
      if (
        hook &&
        typeof hook === "object" &&
        "name" in hook &&
        "content" in hook
      ) {
        const filePath = `${hooksDir}/${String(hook.name)}.json`;
        await ipc.client.claude.writeClaudeFile({
          filePath,
          content: String(hook.content),
        });
      }
    }
  };

  const handleTestHook = () => {
    if (!selectedHookData) {
      return;
    }

    setTestingHook(selectedHookData.name);
    try {
      const parsed: HookJson = JSON.parse(selectedHookData.content || "{}");

      validateHookScript(parsed);
      validateHookMethods(parsed);

      // biome-ignore lint/suspicious/noAlert: Replacing with toast is out of scope
      alert("Hook validation passed! The hook structure and syntax are valid.");
    } catch (error) {
      // biome-ignore lint/suspicious/noAlert: Replacing with toast is out of scope
      alert(
        `Hook validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setTestingHook(null);
    }
  };

  const validateHookScript = (parsed: HookJson) => {
    if (!parsed.script) {
      return;
    }

    try {
      new Function(parsed.script);
    } catch (e) {
      throw new Error(
        `Script syntax error: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  };

  const validateHookMethods = (parsed: HookJson) => {
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
            `${method} syntax error: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
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
      {!(activePath || loading) && (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Select a project to manage hooks
          </p>
        </div>
      )}

      {/* Main content */}
      {activePath && (
        <PanelGroup className="flex-1 overflow-hidden" direction="horizontal">
          {/* Hooks List */}
          <Panel
            className={cn(
              "border-r bg-muted/30 transition-all duration-300 ease-in-out",
              sidebarCollapsed ? "min-w-[36px]" : "min-w-[210px]"
            )}
            collapsedSize={36}
            collapsible
            defaultSize={250}
            maxSize={350}
            minSize={210}
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                <Spinner
                  className={cn(
                    "h-6 w-6 animate-spin text-muted-foreground",
                    sidebarCollapsed && "h-4 w-4"
                  )}
                  weight="regular"
                />
              </div>
            ) : (
              <div className="flex h-full flex-col overflow-hidden">
                <div className="shrink-0 space-y-1 p-2">
                  {/* Add Hook Button / Form */}
                  {isAdding && !sidebarCollapsed ? (
                    <div className="rounded-md border border-primary/20 bg-primary/10 p-3">
                      <Form {...createForm}>
                        <form
                          className="space-y-2"
                          onSubmit={createForm.handleSubmit(handleConfirmAdd)}
                        >
                          <FormField
                            control={createForm.control}
                            name="hookType"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  defaultValue={field.value}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    createForm.setValue(
                                      "name",
                                      `my-${value.toLowerCase()}-hook`
                                    );
                                  }}
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
                                    autoFocus
                                    className="font-mono text-sm"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
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
                      </Form>
                    </div>
                  ) : (
                    <Button
                      className={cn(
                        "w-full border p-3",
                        sidebarCollapsed &&
                          "flex h-10 justify-center border-none p-0"
                      )}
                      onClick={handleAdd}
                      variant="ghost"
                    >
                      <PlusCircle className="h-5 w-5" weight="regular" />
                      {!sidebarCollapsed && (
                        <span className="font-medium text-sm">Add Hook</span>
                      )}
                    </Button>
                  )}
                </div>

                {/* Hooks List */}
                {hooks.length === 0 && !isAdding ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <WarningCircle
                        className={cn(
                          "mx-auto mb-2 h-8 w-8 opacity-50",
                          sidebarCollapsed && "mb-0"
                        )}
                        weight="regular"
                      />
                      {!sidebarCollapsed && (
                        <>
                          <p className="text-sm">No hooks configured</p>
                          <p className="mt-1 text-xs">
                            Create hooks to customize behavior
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                    {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex list item rendering - refactoring would require extracting HookListItem component */}
                    {hooks.map((hook) => {
                      const validationError = validationErrors[hook.name];
                      const isValid =
                        hook.isValid !== false && !validationError;

                      return (
                        <button
                          className={cn(
                            "cursor-pointer rounded-md p-3 transition-colors",
                            selectedHook === hook.name
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted",
                            sidebarCollapsed && "flex justify-center p-2"
                          )}
                          key={hook.name}
                          onClick={() => setSelectedHook(hook.name)}
                          title={sidebarCollapsed ? hook.name : undefined}
                          type="button"
                        >
                          <div
                            className={cn(
                              "flex items-start justify-between gap-2",
                              sidebarCollapsed && "justify-center"
                            )}
                          >
                            {sidebarCollapsed ? (
                              <div className="relative">
                                {isValid ? (
                                  <CheckCircle
                                    className="h-4 w-4 shrink-0 text-green-500"
                                    weight="regular"
                                  />
                                ) : (
                                  <WarningCircle
                                    className="h-4 w-4 shrink-0 text-red-500"
                                    weight="regular"
                                  />
                                )}
                                {!hook.enabled && (
                                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-background bg-gray-500" />
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate font-medium text-sm">
                                      {hook.name}
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
                                  <span className="text-xs opacity-70">
                                    {hook.hookType || "Unknown"}
                                  </span>
                                </div>
                                <button
                                  className="shrink-0 rounded p-1 hover:bg-background/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleEnabled(hook.name);
                                  }}
                                  title={hook.enabled ? "Disable" : "Enable"}
                                  type="button"
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
                              </>
                            )}
                          </div>
                          {!sidebarCollapsed && validationError && (
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
            )}
          </Panel>

          <PanelResizeHandle />

          {/* Hook Editor */}
          <Panel defaultSize="75%" minSize="60%">
            <div className="flex h-full min-w-0 flex-col overflow-hidden">
              {selectedHookData ? (
                <div className="flex h-full flex-1 flex-col overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between border-b bg-background p-3">
                    <div className="flex gap-2">
                      <Button
                        disabled={hooks.length === 0}
                        onClick={handleImport}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="mr-1 h-4 w-4" weight="regular" />
                        Import
                      </Button>
                      <Button
                        disabled={hooks.length === 0}
                        onClick={handleExport}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="mr-1 h-4 w-4" weight="regular" />
                        Export
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        disabled={testingHook === selectedHookData.name}
                        onClick={handleTestHook}
                        size="sm"
                        variant="outline"
                      >
                        {testingHook === selectedHookData.name ? (
                          <Spinner
                            className="mr-1 h-4 w-4 animate-spin"
                            weight="regular"
                          />
                        ) : (
                          <Play className="mr-1 h-4 w-4" weight="regular" />
                        )}
                        Test
                      </Button>
                      <Button
                        disabled={saving}
                        onClick={handleSave}
                        size="sm"
                        variant="outline"
                      >
                        <FloppyDisk className="mr-1 h-4 w-4" weight="regular" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        onClick={handleDelete}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash className="mr-1 h-4 w-4" weight="regular" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Editor Content */}
                  <div className="flex-1 overflow-auto">
                    <CodeEditor
                      height="100%"
                      language="json"
                      onChange={(value) => {
                        if (value !== undefined && selectedHook) {
                          setHooks(
                            hooks.map((h) =>
                              h.name === selectedHook
                                ? { ...h, content: value }
                                : h
                            )
                          );
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next[selectedHookData.name];
                            return next;
                          });
                        }
                      }}
                      value={selectedHookData.content || ""}
                    />
                  </div>

                  {/* Validation status */}
                  {validationErrors[selectedHookData.name] && (
                    <div className="border-red-500/20 border-t bg-red-500/10 p-3">
                      <p className="flex items-center gap-2 text-red-700 text-sm">
                        <WarningCircle className="h-4 w-4" weight="regular" />
                        {validationErrors[selectedHookData.name]}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <WarningCircle
                      className="mx-auto mb-3 h-12 w-12 opacity-50"
                      weight="regular"
                    />
                    <p>Select a hook to edit</p>
                    <p className="mt-1 text-sm">
                      Or create a new hook to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
};

export default HooksTab;
