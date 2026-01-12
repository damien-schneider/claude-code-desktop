import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  FileText,
  FolderOpen,
  PlusCircle,
  Trash,
  X,
} from "@phosphor-icons/react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
  ResizableHandle as PanelResizeHandle,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TipTapEditor } from "@/renderer/components/tip-tap-editor";
import { showError } from "@/renderer/lib/toast";
import { type RuleCreateValues, ruleCreateSchema } from "@/schemas/claude";
import { cn } from "@/utils/tailwind";
import { useClaudeItems } from "../hooks/use-claude-items";

export const RulesTab: React.FC = () => {
  const {
    items: rules,
    loading,
    activePath,
    createItem,
    deleteItem,
    saveItem,
  } = useClaudeItems({ type: "rules", currentView: "rules" });

  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [ruleContents, setRuleContents] = useState<Record<string, string>>({});
  const [originalRuleContents, setOriginalRuleContents] = useState<
    Record<string, string>
  >({});

  // Form for creating new rule (name input)
  const createForm = useForm<RuleCreateValues>({
    resolver: zodResolver(ruleCreateSchema),
    defaultValues: {
      name: "",
    },
  });

  // Sync content when items are loaded
  useEffect(() => {
    const contents: Record<string, string> = {};
    for (const rule of rules) {
      if (rule.content) {
        contents[rule.path] = rule.content;
      }
    }
    setRuleContents((prev) => ({ ...prev, ...contents }));
    setOriginalRuleContents((prev) => ({ ...prev, ...contents }));
  }, [rules]);

  // Load full content when selecting a rule
  useEffect(() => {
    if (!selectedRule) {
      return;
    }

    // Only load if content is empty (not already loaded)
    const rule = rules.find((r) => r.path === selectedRule);
    if (rule && !rule.content && !ruleContents[selectedRule]) {
      const loadFullContent = async () => {
        try {
          const { ipc } = await import("@/ipc/manager");
          const result = await ipc.client.claude.readFileContent({
            filePath: selectedRule,
          });
          if (result.exists) {
            setRuleContents((prev) => ({
              ...prev,
              [selectedRule]: result.content,
            }));
            setOriginalRuleContents((prev) => ({
              ...prev,
              [selectedRule]: result.content,
            }));
          }
        } catch (error) {
          console.error("Failed to load rule content:", error);
        }
      };
      loadFullContent();
    }
  }, [selectedRule, rules, ruleContents]);

  const selectedRuleData = rules.find((r) => r.path === selectedRule);

  const hasChanges = useMemo(() => {
    if (!selectedRule) {
      return false;
    }
    return ruleContents[selectedRule] !== originalRuleContents[selectedRule];
  }, [selectedRule, ruleContents, originalRuleContents]);

  const handleSave = async () => {
    if (!(selectedRule && selectedRuleData)) {
      return;
    }

    setSaving(true);
    try {
      const content = ruleContents[selectedRule] || selectedRuleData.content;
      await saveItem(selectedRuleData.path, content);
      setOriginalRuleContents((prev) => ({ ...prev, [selectedRule]: content }));
    } catch (error) {
      console.error("Failed to save rule:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedRule) {
      setRuleContents((prev) => ({
        ...prev,
        [selectedRule]: originalRuleContents[selectedRule] || "",
      }));
    }
  };

  // Keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, saving, handleSave]);

  const handleDelete = async () => {
    if (!selectedRule) {
      return;
    }

    // biome-ignore lint/suspicious/noAlert: confirm is used for deletion
    if (window.confirm("Are you sure you want to delete this rule?")) {
      const success = await deleteItem(selectedRule);
      if (success) {
        setSelectedRule(null);
        setRuleContents((prev) => {
          const updated = { ...prev };
          delete updated[selectedRule];
          return updated;
        });
      }
    }
  };

  const handleAdd = () => {
    if (!activePath) {
      showError(
        "Cannot add rule",
        "Please select a project or global settings first"
      );
      return;
    }
    setIsAdding(true);
    createForm.reset();
  };

  const handleConfirmAdd = async (values: RuleCreateValues) => {
    const result = await createItem(values.name);

    if (result.success && result.path) {
      setSelectedRule(result.path);
      setIsAdding(false);
      createForm.reset();
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    createForm.reset();
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Main Content */}
        <PanelGroup className="flex-1 overflow-hidden" orientation="horizontal">
          {/* Rules List */}
          <Panel
            className="border-r bg-muted/30"
            defaultSize={25}
            maxSize={40}
            minSize={15}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : (
              <div className="flex h-full flex-col overflow-hidden">
                <div className="shrink-0 space-y-1 p-2">
                  {/* Add Rule Button / Form */}
                  {isAdding ? (
                    <div className="rounded-md border border-primary/20 bg-primary/10 p-2">
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
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    handleCancelAdd();
                                  }
                                }}
                                placeholder="my-rule (optional, leave empty for auto-name)"
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
                  ) : (
                    <button
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed p-3 transition-colors",
                        activePath
                          ? "cursor-pointer border-primary/50 hover:border-primary hover:bg-primary/5"
                          : "cursor-not-allowed border-muted opacity-50"
                      )}
                      disabled={!activePath}
                      onClick={handleAdd}
                      title={
                        activePath
                          ? "Add new rule"
                          : "Select a project or global settings first"
                      }
                      type="button"
                    >
                      <PlusCircle className="h-5 w-5" weight="regular" />
                      <span className="font-medium text-sm">Add Rule</span>
                    </button>
                  )}
                </div>

                {/* Rules List */}
                {rules.length === 0 && !isAdding ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p className="text-sm">No rules configured</p>
                      <p className="mt-1 text-xs">
                        Create rules to guide Claude's behavior
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                    {rules.map((rule) => (
                      <button
                        className={cn(
                          "w-full rounded-md p-2 transition-colors",
                          selectedRule === rule.path
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/50"
                        )}
                        key={rule.path}
                        onClick={() => setSelectedRule(rule.path)}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate font-medium text-sm">
                            {rule.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>

          <PanelResizeHandle />

          {/* Rule Editor */}
          <Panel defaultSize={75} minSize={60}>
            <div className="flex h-full flex-1 flex-col overflow-hidden">
              {selectedRuleData ? (
                <div className="relative flex-1 overflow-auto p-4">
                  <TipTapEditor
                    actions={
                      <ButtonGroup>
                        <Tooltip>
                          <TooltipTrigger
                            render={() => (
                              <Button
                                disabled={saving || !hasChanges}
                                onClick={handleSave}
                                size="icon"
                                variant="default"
                              >
                                <Check className="h-4 w-4" weight="regular" />
                              </Button>
                            )}
                          />
                          <TooltipContent>
                            <p>Save (⌘S)</p>
                          </TooltipContent>
                        </Tooltip>
                        {hasChanges && (
                          <Tooltip>
                            <TooltipTrigger
                              render={() => (
                                <Button
                                  disabled={saving}
                                  onClick={handleCancel}
                                  size="icon"
                                  variant="outline"
                                >
                                  <X className="h-4 w-4" weight="regular" />
                                </Button>
                              )}
                            />
                            <TooltipContent>
                              <p>Cancel changes</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger
                            render={() => (
                              <Button
                                onClick={handleDelete}
                                size="icon"
                                variant="destructive"
                              >
                                <Trash className="h-4 w-4" weight="regular" />
                              </Button>
                            )}
                          />
                          <TooltipContent>
                            <p>Delete</p>
                          </TooltipContent>
                        </Tooltip>
                      </ButtonGroup>
                    }
                    className="min-h-full"
                    content={
                      selectedRule
                        ? ruleContents[selectedRule] || selectedRuleData.content
                        : ""
                    }
                    onChange={(content) => {
                      if (selectedRule) {
                        setRuleContents((prev) => ({
                          ...prev,
                          [selectedRule]: content,
                        }));
                      }
                    }}
                    placeholder="Write your rule content here..."
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FolderOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
                    <p>Select a rule to edit</p>
                    <p className="mt-1 text-sm">
                      Or create a new rule to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </TooltipProvider>
  );
};

export default RulesTab;
