import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  FloppyDisk,
  HardDrives,
  PlusCircle,
  Trash,
} from "@phosphor-icons/react";
import type React from "react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
  ResizableHandle as PanelResizeHandle,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type AgentFrontmatter,
  agentFrontmatterSchema,
  buildFrontmatter,
  parseFrontmatter,
} from "@/ipc/schemas";
import { TipTapEditor } from "@/renderer/components/tip-tap-editor";
import { showError } from "@/renderer/lib/toast";
import {
  type AgentCreateValues,
  type AgentFormValues,
  agentCreateSchema,
  agentFormSchema,
} from "@/schemas/claude";
import { cn } from "@/utils/tailwind";
import { useClaudeItems } from "../hooks/use-claude-items";

interface Agent {
  name: string;
  path: string;
  content: string;
  type: "file" | "directory";
  // Parsed from frontmatter
  displayName?: string;
  description?: string;
  instructions?: string;
  tools?: string[];
  permissions?: string[];
  model?: string;
  color?: string;
}

const parseAgentContent = (
  content: string
): { frontmatter?: AgentFrontmatter; body?: string } => {
  return parseFrontmatter(content, agentFrontmatterSchema);
};

const buildAgentContent = (values: AgentFormValues): string => {
  const {
    name,
    description,
    instructions,
    tools,
    permissions,
    model,
    color,
    content = "",
  } = values;

  const frontmatterData: Record<string, string | string[]> = {
    name,
    description,
  };

  if (instructions) {
    frontmatterData.instructions = instructions;
  }
  if (tools) {
    frontmatterData.tools = tools
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  if (permissions) {
    frontmatterData.permissions = permissions
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (model) {
    frontmatterData.model = model;
  }
  if (color) {
    frontmatterData.color = color;
  }

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
  } = useClaudeItems({ type: "agents", currentView: "agents" });

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
  const [rawContent, setRawContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Form for agent editing
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      tools: "",
      permissions: "",
      model: "",
      color: "",
      content: "",
    },
  });

  // Form for creating new agent (name input)
  const createForm = useForm<AgentCreateValues>({
    resolver: zodResolver(agentCreateSchema),
    defaultValues: {
      name: "",
    },
  });

  // Load selected agent content into form
  useEffect(() => {
    if (!selectedAgent) {
      form.reset();
      setRawContent("");
      return;
    }

    const agent = agents.find((a) => a.path === selectedAgent);
    if (agent) {
      const parsed = parseAgentContent(agent.content);
      form.reset({
        name: parsed.frontmatter?.name || agent.name,
        description: parsed.frontmatter?.description || "",
        instructions: parsed.frontmatter?.instructions || "",
        tools: parsed.frontmatter?.tools?.join(", ") || "",
        permissions: parsed.frontmatter?.permissions?.join(", ") || "",
        model: parsed.frontmatter?.model || "",
        color: parsed.frontmatter?.color || "",
        content: parsed.body || "",
      });
      setRawContent(agent.content);
    }
  }, [selectedAgent, agents, form]);

  const selectedAgentData = agents.find((a) => a.path === selectedAgent);

  const handleSave = async (values: AgentFormValues) => {
    if (!selectedAgent) {
      return;
    }

    setSaving(true);
    try {
      const agentContent = isRawMode ? rawContent : buildAgentContent(values);

      await saveItem(selectedAgent, agentContent);
      await loadItems();
    } catch (error) {
      console.error("Failed to save agent:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) {
      return;
    }

    // biome-ignore lint/suspicious/noAlert: confirm is acceptable for deletion
    if (window.confirm("Are you sure you want to delete this agent?")) {
      const success = await deleteItem(selectedAgent);
      if (success) {
        setSelectedAgent(null);
      }
    }
  };

  const handleAdd = () => {
    if (!activePath) {
      showError(
        "Cannot add agent",
        "Please select a project or global settings first"
      );
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

  const renderAgentsList = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Loading...
        </div>
      );
    }

    return (
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {/* Add Agent Button / Form */}
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
                      placeholder="my-agent-name (optional, leave empty for auto-name)"
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
                ? "Add new agent"
                : "Select a project or global settings first"
            }
            type="button"
          >
            <PlusCircle className="h-5 w-5" weight="regular" />
            <span className="font-medium text-sm">Add Agent</span>
          </button>
        )}

        {/* Agents List */}
        {agents.length === 0 && !isAdding ? (
          <div className="flex h-[calc(100%-60px)] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <HardDrives
                className="mx-auto mb-2 h-8 w-8 opacity-50"
                weight="regular"
              />
              <p className="text-sm">No agents found</p>
              <p className="mt-1 text-xs">
                Create agents to delegate specialized tasks
              </p>
            </div>
          </div>
        ) : (
          agents.map((agent) => (
            <button
              className={cn(
                "flex w-full items-start gap-2 rounded-md p-2 text-left transition-colors",
                selectedAgent === agent.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/50"
              )}
              key={agent.path}
              onClick={() => setSelectedAgent(agent.path)}
              type="button"
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-sm">
                  {agent.displayName || agent.name}
                </div>
                <div className="truncate text-xs opacity-70">
                  {agent.description || "No description"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    );
  };

  const renderAgentEditor = () => {
    if (!selectedAgentData) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <HardDrives
              className="mx-auto mb-3 h-12 w-12 opacity-50"
              weight="regular"
            />
            <p>Select an agent to edit</p>
            <p className="mt-1 text-sm">Or create a new agent to get started</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b bg-background p-3">
          <div className="flex gap-2">
            <Button
              onClick={() => setIsRawMode(false)}
              size="sm"
              variant={isRawMode ? "outline" : "default"}
            >
              Form
            </Button>
            <Button
              onClick={() => setIsRawMode(true)}
              size="sm"
              variant={isRawMode ? "default" : "outline"}
            >
              Raw
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={saving}
              onClick={form.handleSubmit(handleSave)}
              size="sm"
              variant="outline"
            >
              <FloppyDisk className="mr-1 h-4 w-4" weight="regular" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handleDelete} size="sm" variant="destructive">
              <Trash className="mr-1 h-4 w-4" weight="regular" />
              Delete
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto">
          {isRawMode ? (
            <TipTapEditor
              className="min-h-full"
              content={rawContent}
              onChange={setRawContent}
              placeholder="---\nname: agent-name\ndescription: Description of when to use this agent\n---\n\n# Agent Name\n\nAdd your agent instructions here..."
            />
          ) : (
            <form
              className="space-y-4 p-4"
              onSubmit={form.handleSubmit(handleSave)}
            >
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Name (internal ID)</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="font-mono text-sm"
                      id="name"
                      placeholder="my-agent-name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="description">Description *</FieldLabel>
                    <Textarea
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="text-sm"
                      id="description"
                      placeholder="Describe what this agent does and when Claude should use it..."
                      rows={3}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="instructions"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="instructions">
                      Instructions (in frontmatter)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="text-sm"
                      id="instructions"
                      placeholder="Additional instructions stored in frontmatter..."
                      rows={2}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="tools"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="tools">
                      Tools (comma-separated)
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="font-mono text-sm"
                      id="tools"
                      placeholder="tool1, tool2, tool3"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="permissions"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="permissions">
                      Permissions (comma-separated)
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="font-mono text-sm"
                      id="permissions"
                      placeholder="perm1, perm2, perm3"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="model"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="model">Model</FieldLabel>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        className="text-sm"
                        id="model"
                        placeholder="opus, sonnet, haiku"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="color"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="color">Color</FieldLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="color">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
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
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                control={form.control}
                name="content"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="content">
                      Agent Instructions (body)
                    </FieldLabel>
                    <TipTapEditor
                      className="min-h-[400px]"
                      content={field.value || ""}
                      onChange={field.onChange}
                      placeholder={`# Agent Name

You are a specialist agent for...

## Instructions
- Step-by-step guidance
- Best practices
- Examples
`}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Main Content */}
      <PanelGroup className="flex-1 overflow-hidden" orientation="horizontal">
        {/* Agents List */}
        <Panel
          className="border-r bg-muted/30"
          defaultSize={25}
          maxSize={40}
          minSize={15}
        >
          {renderAgentsList()}
        </Panel>

        <PanelResizeHandle />

        {/* Agent Editor */}
        <Panel defaultSize={75} minSize={60}>
          {renderAgentEditor()}
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default AgentsTab;
