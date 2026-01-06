import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, FloppyDisk, Trash, FileText, FolderOpen, PlusCircle, X, Check } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TipTapEditor } from '@/renderer/components/TipTapEditor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useClaudeItems } from '../Hooks/useClaudeItems';
import { cn } from '@/utils/tailwind';
import { showError } from '@/renderer/lib/toast';
import {
  ruleCreateSchema,
  type RuleCreateValues,
} from '@/schemas/claude';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ButtonGroup,
} from '@/components/ui/button-group';

export const RulesTab: React.FC = () => {
  const {
    items: rules,
    loading,
    activePath,
    createItem,
    deleteItem,
    saveItem,
  } = useClaudeItems({ type: 'rules', currentView: 'rules' });

  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [ruleContents, setRuleContents] = useState<Record<string, string>>({});
  const [originalRuleContents, setOriginalRuleContents] = useState<Record<string, string>>({});

  // Form for creating new rule (name input)
  const createForm = useForm<RuleCreateValues>({
    resolver: zodResolver(ruleCreateSchema),
    defaultValues: {
      name: '',
    },
  });

  // Sync content when items are loaded
  useEffect(() => {
    const contents: Record<string, string> = {};
    rules.forEach(rule => {
      if (rule.content) {
        contents[rule.path] = rule.content;
      }
    });
    setRuleContents(prev => ({ ...prev, ...contents }));
    setOriginalRuleContents(prev => ({ ...prev, ...contents }));
  }, [rules]);

  // Load full content when selecting a rule
  useEffect(() => {
    if (!selectedRule) return;

    // Only load if content is empty (not already loaded)
    const rule = rules.find(r => r.path === selectedRule);
    if (rule && !rule.content && !ruleContents[selectedRule]) {
      const loadFullContent = async () => {
        try {
          const { ipc } = await import('@/ipc/manager');
          const result = await ipc.client.claude.readFileContent({ filePath: selectedRule });
          if (result.exists) {
            setRuleContents(prev => ({ ...prev, [selectedRule]: result.content }));
            setOriginalRuleContents(prev => ({ ...prev, [selectedRule]: result.content }));
          }
        } catch (error) {
          console.error('Failed to load rule content:', error);
        }
      };
      loadFullContent();
    }
  }, [selectedRule, rules, ruleContents]);

  const selectedRuleData = rules.find((r) => r.path === selectedRule);

  const hasChanges = useMemo(() => {
    if (!selectedRule) return false;
    return ruleContents[selectedRule] !== originalRuleContents[selectedRule];
  }, [selectedRule, ruleContents, originalRuleContents]);

  const handleSave = async () => {
    if (!selectedRule || !selectedRuleData) return;

    setSaving(true);
    try {
      const content = ruleContents[selectedRule] || selectedRuleData.content;
      await saveItem(selectedRuleData.path, content);
      setOriginalRuleContents(prev => ({ ...prev, [selectedRule]: content }));
    } catch (error) {
      console.error('Failed to save rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedRule) {
      setRuleContents(prev => ({ ...prev, [selectedRule]: originalRuleContents[selectedRule] || '' }));
    }
  };

  // Keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, saving, handleSave]);

  const handleDelete = async () => {
    if (!selectedRule) return;

    if (confirm('Are you sure you want to delete this rule?')) {
      const success = await deleteItem(selectedRule);
      if (success) {
        setSelectedRule(null);
        setRuleContents(prev => {
          const updated = { ...prev };
          delete updated[selectedRule];
          return updated;
        });
      }
    }
  };

  const handleAdd = () => {
    if (!activePath) {
      showError('Cannot add rule', 'Please select a project or global settings first');
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
      <div className="flex flex-col h-full">
        {/* Main Content */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          {/* Rules List */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40} className="border-r bg-muted/30">
            {loading ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-2 space-y-1 flex-shrink-0">
                  {/* Add Rule Button / Form */}
                  {isAdding ? (
                    <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
                      <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(handleConfirmAdd)} className="space-y-2">
                          <FormField
                            control={createForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="my-rule (optional, leave empty for auto-name)"
                                    className="font-mono text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') handleCancelAdd();
                                    }}
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
                            <Button type="button" size="sm" variant="outline" onClick={handleCancelAdd} className="flex-1">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  ) : (
                    <button
                      onClick={handleAdd}
                      disabled={!activePath}
                      className={cn(
                        'w-full p-3 rounded-md border-2 border-dashed transition-colors flex items-center justify-center gap-2',
                        activePath
                          ? 'border-primary/50 hover:border-primary hover:bg-primary/5 cursor-pointer'
                          : 'border-muted opacity-50 cursor-not-allowed'
                      )}
                      title={!activePath ? "Select a project or global settings first" : "Add new rule"}
                    >
                      <PlusCircle className="h-5 w-5" weight="regular" />
                      <span className="text-sm font-medium">Add Rule</span>
                    </button>
                  )}
                </div>

                {/* Rules List */}
                {rules.length === 0 && !isAdding ? (
                  <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No rules configured</p>
                      <p className="text-xs mt-1">Create rules to guide Claude's behavior</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                    {rules.map((rule) => (
                      <div
                        key={rule.path}
                        className={cn(
                          'p-2 rounded-md cursor-pointer transition-colors',
                          selectedRule === rule.path
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedRule(rule.path)}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{rule.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Rule Editor */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <div className="flex-1 flex flex-col overflow-hidden h-full">
            {selectedRuleData ? (
              <div className="flex-1 overflow-auto p-4 relative">
                <TipTapEditor
                  content={selectedRule ? (ruleContents[selectedRule] || selectedRuleData.content) : ''}
                  onChange={(content) => {
                    if (selectedRule) {
                      setRuleContents(prev => ({ ...prev, [selectedRule]: content }));
                    }
                  }}
                  placeholder="Write your rule content here..."
                  className="min-h-full"
                  hasChanges={hasChanges}
                  actions={
                    <ButtonGroup>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="default"
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                          >
                            <Check className="h-4 w-4" weight="regular" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save (⌘S)</p>
                        </TooltipContent>
                      </Tooltip>
                      {hasChanges && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" weight="regular" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancel changes</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={handleDelete}
                          >
                            <Trash className="h-4 w-4" weight="regular" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    </ButtonGroup>
                  }
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a rule to edit</p>
                  <p className="text-sm mt-1">Or create a new rule to get started</p>
                </div>
              </div>
            )}
          </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
};

export default RulesTab;
