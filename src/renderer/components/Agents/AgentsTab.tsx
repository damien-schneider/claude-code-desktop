import React, { useState, useEffect } from 'react';
import { Plus, FloppyDisk, Trash, HardDrives, FolderOpen, Pencil, FileText, PlusCircle } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TipTapEditor } from '@/renderer/components/TipTapEditor';
import { useClaudeItems } from '../Hooks/useClaudeItems';
import { showError } from '@/renderer/lib/toast';
import {
  parseFrontmatter,
  buildFrontmatter,
  agentFrontmatterSchema,
  type AgentFrontmatter,
} from '@/ipc/schemas';
import { cn } from '@/utils/tailwind';
import {
  agentFormSchema,
  agentCreateSchema,
  type AgentFormValues,
  type AgentCreateValues,
} from '@/schemas/claude';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

interface Agent {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
  // Parsed from frontmatter
  displayName?: string;
  description?: string;
  instructions?: string;
  tools?: string[];
  permissions?: string[];
  model?: string;
  color?: string;
}

const parseAgentContent = (content: string): { frontmatter?: AgentFrontmatter; body?: string } => {
  return parseFrontmatter(content, agentFrontmatterSchema);
};

const buildAgentContent = (values: AgentFormValues): string => {
  const { name, description, instructions, tools, permissions, model, color, content = '' } = values;

  const frontmatterData: Record<string, string | string[]> = {
    name,
    description,
  };

  if (instructions) frontmatterData.instructions = instructions;
  if (tools) {
    frontmatterData.tools = tools.split(',').map(t => t.trim()).filter(Boolean);
  }
  if (permissions) {
    frontmatterData.permissions = permissions.split(',').map(p => p.trim()).filter(Boolean);
  }
  if (model) frontmatterData.model = model;
  if (color) frontmatterData.color = color;

  return `${buildFrontmatter(frontmatterData)}\n\n# ${name}\n\nYou are a specialist agent for...\n\n## Instructions\n\n${content}`;
};

export const AgentsTab: React.FC = () => {
  const {
    items: rawAgents,
    loading,
    activePath,
    createItem,
    deleteItem,
    saveItem,
    loadItems,
  } = useClaudeItems({ type: 'agents', currentView: 'agents' });

  // Parse agents to extract frontmatter
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const parsed = rawAgents.map((item): Agent => {
      const parsed = parseAgentContent(item.content);
      return {
        name: item.name,
        path: item.path,
        content: item.content,
        type: item.type,
        displayName: parsed.frontmatter?.name,
        description: parsed.frontmatter?.description,
        instructions: parsed.frontmatter?.instructions,
        tools: parsed.frontmatter?.tools,
        permissions: parsed.frontmatter?.permissions,
        model: parsed.frontmatter?.model,
        color: parsed.frontmatter?.color,
      };
    });
    setAgents(parsed);
  }, [rawAgents]);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawContent, setRawContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form for agent editing
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      instructions: '',
      tools: '',
      permissions: '',
      model: '',
      color: '',
      content: '',
    },
  });

  // Form for creating new agent (name input)
  const createForm = useForm<AgentCreateValues>({
    resolver: zodResolver(agentCreateSchema),
    defaultValues: {
      name: '',
    },
  });

  // Load selected agent content into form
  useEffect(() => {
    if (!selectedAgent) {
      form.reset();
      setRawContent('');
      return;
    }

    const agent = agents.find((a) => a.path === selectedAgent);
    if (agent) {
      const parsed = parseAgentContent(agent.content);
      form.reset({
        name: parsed.frontmatter?.name || agent.name,
        description: parsed.frontmatter?.description || '',
        instructions: parsed.frontmatter?.instructions || '',
        tools: parsed.frontmatter?.tools?.join(', ') || '',
        permissions: parsed.frontmatter?.permissions?.join(', ') || '',
        model: parsed.frontmatter?.model || '',
        color: parsed.frontmatter?.color || '',
        content: parsed.body || '',
      });
      setRawContent(agent.content);
    }
  }, [selectedAgent, agents, form]);

  const selectedAgentData = agents.find((a) => a.path === selectedAgent);

  const handleSave = async (values: AgentFormValues) => {
    if (!selectedAgent) return;

    setSaving(true);
    try {
      const agentContent = isRawMode
        ? rawContent
        : buildAgentContent(values);

      await saveItem(selectedAgent, agentContent);
      await loadItems();
    } catch (error) {
      console.error('Failed to save agent:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;

    if (confirm('Are you sure you want to delete this agent?')) {
      const success = await deleteItem(selectedAgent);
      if (success) {
        setSelectedAgent(null);
      }
    }
  };

  const handleAdd = () => {
    if (!activePath) {
      showError('Cannot add agent', 'Please select a project or global settings first');
      return;
    }
    setIsAdding(true);
    createForm.reset();
  };

  const handleConfirmAdd = async (values: AgentCreateValues) => {
    const result = await createItem(values.name);

    if (result.success && result.path) {
      setSelectedAgent(result.path);
      setIsAdding(false);
      createForm.reset();
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    createForm.reset();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Agents List */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40} className="border-r bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {/* Add Agent Button / Form */}
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
                                placeholder="my-agent-name (optional, leave empty for auto-name)"
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
                  title={!activePath ? "Select a project or global settings first" : "Add new agent"}
                >
                  <PlusCircle className="h-5 w-5" weight="regular" />
                  <span className="text-sm font-medium">Add Agent</span>
                </button>
              )}

              {/* Agents List */}
              {agents.length === 0 && !isAdding ? (
                <div className="flex items-center justify-center h-[calc(100%-60px)] text-muted-foreground">
                  <div className="text-center">
                    <HardDrives className="h-8 w-8 mx-auto mb-2 opacity-50" weight="regular" />
                    <p className="text-sm">No agents found</p>
                    <p className="text-xs mt-1">Create agents to delegate specialized tasks</p>
                  </div>
                </div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.path}
                    className={cn(
                      'p-2 rounded-md cursor-pointer transition-colors',
                      selectedAgent === agent.path
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedAgent(agent.path)}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{agent.displayName || agent.name}</div>
                        <div className="text-xs opacity-70 truncate">{agent.description || 'No description'}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Agent Editor */}
        <ResizablePanel defaultSize={75} minSize={60}>
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            {selectedAgentData ? (
              <>
                {/* Toolbar */}
                <div className="p-3 border-b bg-background flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isRawMode ? 'outline' : 'default'}
                      onClick={() => setIsRawMode(false)}
                    >
                      Form
                    </Button>
                    <Button
                      size="sm"
                      variant={isRawMode ? 'default' : 'outline'}
                      onClick={() => setIsRawMode(true)}
                    >
                      Raw
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={form.handleSubmit(handleSave)} disabled={saving}>
                      <FloppyDisk className="h-4 w-4 mr-1" weight="regular" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDelete}>
                      <Trash className="h-4 w-4 mr-1" weight="regular" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-auto">
                  {isRawMode ? (
                    <TipTapEditor
                      content={rawContent}
                      onChange={setRawContent}
                      placeholder="---\nname: agent-name\ndescription: Description of when to use this agent\n---\n\n# Agent Name\n\nAdd your agent instructions here..."
                      className="min-h-full"
                    />
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSave)} className="p-4 space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name (internal ID)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="my-agent-name" className="font-mono text-sm" />
                              </FormControl>
                              <FormDescription>
                                Lowercase letters, numbers, and hyphens only. Max 64 characters.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Describe what this agent does and when Claude should use it..." rows={3} className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="instructions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instructions (in frontmatter)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Additional instructions stored in frontmatter..." rows={2} className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tools"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tools (comma-separated)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="tool1, tool2, tool3" className="font-mono text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="permissions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Permissions (comma-separated)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="perm1, perm2, perm3" className="font-mono text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Model</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="opus, sonnet, haiku" className="text-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Color</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a color" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="blue">Blue</SelectItem>
                                    <SelectItem value="green">Green</SelectItem>
                                    <SelectItem value="purple">Purple</SelectItem>
                                    <SelectItem value="red">Red</SelectItem>
                                    <SelectItem value="orange">Orange</SelectItem>
                                    <SelectItem value="yellow">Yellow</SelectItem>
                                    <SelectItem value="pink">Pink</SelectItem>
                                    <SelectItem value="cyan">Cyan</SelectItem>
                                    <SelectItem value="indigo">Indigo</SelectItem>
                                    <SelectItem value="teal">Teal</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agent Instructions (body)</FormLabel>
                              <FormControl>
                                <TipTapEditor
                                  content={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder={`# Agent Name

You are a specialist agent for...

## Instructions
- Step-by-step guidance
- Best practices
- Examples
`}
                                  className="min-h-[400px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <HardDrives className="h-12 w-12 mx-auto mb-3 opacity-50" weight="regular" />
                  <p>Select an agent to edit</p>
                  <p className="text-sm mt-1">Or create a new agent to get started</p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default AgentsTab;
