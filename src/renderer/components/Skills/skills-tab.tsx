import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  FloppyDisk,
  FolderOpen,
  Lightning,
  Pencil,
  PlusCircle,
  Trash,
} from "@phosphor-icons/react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { TipTapEditor } from "@/renderer/components/tip-tap-editor";
import { showError } from "@/renderer/lib/toast";
import {
  type SkillCreateValues,
  type SkillFormValues,
  skillCreateSchema,
  skillFormSchema,
} from "@/schemas/claude";
import { cn } from "@/utils/tailwind";
import { useClaudeItems } from "../hooks/use-claude-items";

// Top-level regex patterns for performance
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
const FRONTMATTER_REPLACE_REGEX = /^---\n[\s\S]*?\n---\n?/;
const NAME_REGEX = /^name:\s*(.+)$/m;
const DESCRIPTION_REGEX = /^description:\s*(.+)$/m;
const LICENSE_REGEX = /^license:\s*(.+)$/m;
const COMPATIBILITY_REGEX = /^compatibility:\s*(.+)$/m;
const METADATA_REGEX = /^metadata:\s*\n((?: {2}.+\n?)+)/m;
const METADATA_LINE_REGEX = /^ {2}(\w+):\s*(.+)$/;

interface Skill {
  name: string;
  path: string;
  content: string;
  type: "file" | "directory";
  hasMetadata: boolean;
  // Parsed from frontmatter
  displayName?: string;
  description?: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
}

interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
}

const parseSkillFrontmatter = (
  content: string
): { frontmatter?: SkillFrontmatter; body?: string } => {
  const yamlMatch = content.match(FRONTMATTER_REGEX);
  if (!yamlMatch) {
    return { body: content };
  }

  try {
    const yaml = yamlMatch[1];
    const frontmatter: SkillFrontmatter = { name: "", description: "" };

    const nameMatch = yaml.match(NAME_REGEX);
    const descMatch = yaml.match(DESCRIPTION_REGEX);
    const licenseMatch = yaml.match(LICENSE_REGEX);
    const compatMatch = yaml.match(COMPATIBILITY_REGEX);

    if (nameMatch) {
      frontmatter.name = nameMatch[1].trim();
    }
    if (descMatch) {
      frontmatter.description = descMatch[1].trim();
    }
    if (licenseMatch) {
      frontmatter.license = licenseMatch[1].trim();
    }
    if (compatMatch) {
      frontmatter.compatibility = compatMatch[1].trim();
    }

    // Parse metadata field if present
    const metadataMatch = yaml.match(METADATA_REGEX);
    if (metadataMatch) {
      frontmatter.metadata = {};
      for (const line of metadataMatch[1].split("\n")) {
        const match = line.match(METADATA_LINE_REGEX);
        if (match) {
          const metadata = frontmatter.metadata;
          if (metadata) {
            metadata[match[1]] = match[2].trim();
          }
        }
      }
    }

    return {
      frontmatter,
      body: content.replace(FRONTMATTER_REPLACE_REGEX, ""),
    };
  } catch {
    return { body: content };
  }
};

const buildSkillContent = (values: SkillFormValues): string => {
  const { name, description, license, compatibility, content = "" } = values;

  // Normalize the name
  const normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  let frontmatter = `---
name: ${normalizedName}
description: ${description}
`;

  if (license) {
    frontmatter += `license: ${license}\n`;
  }

  if (compatibility) {
    frontmatter += `compatibility: ${compatibility}\n`;
  }

  frontmatter += "---\n";

  return `${frontmatter}\n${content}`;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex tab component with state management - refactoring would require extracting custom hooks
export const SkillsTab: React.FC = () => {
  const {
    items: rawSkills,
    loading,
    activePath,
    createItem,
    deleteItem,
    saveItem,
    loadItems,
  } = useClaudeItems({ type: "skills", currentView: "skills" });

  // Parse skills to extract frontmatter
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const parsed = rawSkills.map((item): Skill => {
      const parsed = parseSkillFrontmatter(item.content);
      return {
        name: item.name,
        path: item.path,
        content: item.content,
        type: item.type,
        hasMetadata: !!item.content,
        displayName: parsed.frontmatter?.name,
        description: parsed.frontmatter?.description,
        license: parsed.frontmatter?.license,
        compatibility: parsed.frontmatter?.compatibility,
        metadata: parsed.frontmatter?.metadata,
      };
    });
    setSkills(parsed);
  }, [rawSkills]);

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawContent, setRawContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Form for skill editing
  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: "",
      description: "",
      license: "",
      compatibility: "",
      content: "",
    },
  });

  // Form for creating new skill (name input)
  const createForm = useForm<SkillCreateValues>({
    resolver: zodResolver(skillCreateSchema),
    defaultValues: {
      name: "",
    },
  });

  // Load selected skill content into form
  useEffect(() => {
    if (!selectedSkill) {
      form.reset();
      setRawContent("");
      return;
    }

    const skill = skills.find((s) => s.path === selectedSkill);
    if (skill) {
      const parsed = parseSkillFrontmatter(skill.content);
      form.reset({
        name: parsed.frontmatter?.name || skill.name,
        description: parsed.frontmatter?.description || "",
        license: parsed.frontmatter?.license || "",
        compatibility: parsed.frontmatter?.compatibility || "",
        content: parsed.body || "",
      });
      setRawContent(skill.content);
    }
  }, [selectedSkill, skills, form]);

  const selectedSkillData = skills.find((s) => s.path === selectedSkill);

  const handleSave = async (values: SkillFormValues) => {
    if (!selectedSkill) {
      return;
    }

    setSaving(true);
    try {
      const skillContent = isRawMode ? rawContent : buildSkillContent(values);

      await saveItem(selectedSkill, skillContent);
      await loadItems();
    } catch (error) {
      console.error("Failed to save skill:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSkill) {
      return;
    }

    // biome-ignore lint/suspicious/noAlert: Replacing with modal is out of scope
    if (confirm("Are you sure you want to delete this skill?")) {
      const success = await deleteItem(selectedSkill);
      if (success) {
        setSelectedSkill(null);
      }
    }
  };

  const handleAdd = () => {
    if (!activePath) {
      showError(
        "Cannot add skill",
        "Please select a project or global settings first"
      );
      return;
    }
    setIsAdding(true);
    createForm.reset();
  };

  const handleConfirmAdd = async (values: SkillCreateValues) => {
    const result = await createItem(values.name);

    if (result.success && result.path) {
      setSelectedSkill(result.path);
      setIsAdding(false);
      createForm.reset();
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    createForm.reset();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Main Content */}
      <PanelGroup className="flex-1 overflow-hidden" direction="horizontal">
        {/* Skills List */}
        <Panel
          className="border-r bg-muted/30"
          collapsedSize={36}
          collapsible
          defaultSize={250}
          maxSize={350}
          minSize={210}
          onCollapse={() => setSidebarCollapsed(true)}
          onExpand={() => setSidebarCollapsed(false)}
        >
          <div className="flex h-full flex-col overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : (
              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {/* Add Skill Button / Form */}
                {isAdding ? (
                  <div className="rounded-md border border-primary/20 bg-primary/10 p-2">
                    <Form {...createForm}>
                      <form
                        className="space-y-2"
                        onSubmit={createForm.handleSubmit(handleConfirmAdd)}
                      >
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
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                      handleCancelAdd();
                                    }
                                  }}
                                  placeholder="my-skill-name (optional, leave empty for auto-name)"
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
                  <button
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed transition-colors",
                      activePath
                        ? "cursor-pointer border-primary/50 hover:border-primary hover:bg-primary/5"
                        : "cursor-not-allowed border-muted opacity-50",
                      sidebarCollapsed ? "p-2" : "p-3"
                    )}
                    disabled={!activePath}
                    onClick={handleAdd}
                    title={
                      activePath
                        ? "Add new skill"
                        : "Select a project or global settings first"
                    }
                    type="button"
                  >
                    <PlusCircle className="h-5 w-5" weight="regular" />
                    {!sidebarCollapsed && (
                      <span className="font-medium text-sm">Add Skill</span>
                    )}
                  </button>
                )}

                {/* Skills List */}
                {skills.length === 0 && !isAdding ? (
                  <div className="flex h-[calc(100%-60px)] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Lightning
                        className="mx-auto mb-2 h-8 w-8 opacity-50"
                        weight="regular"
                      />
                      {!sidebarCollapsed && (
                        <>
                          <p className="text-sm">No skills found</p>
                          <p className="mt-1 text-xs">
                            Create skills to extend Claude
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  skills.map((skill) => (
                    <button
                      className={cn(
                        "cursor-pointer rounded-md p-2 transition-colors",
                        selectedSkill === skill.path
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted/50",
                        sidebarCollapsed && "flex justify-center"
                      )}
                      key={skill.path}
                      onClick={() => setSelectedSkill(skill.path)}
                      title={
                        sidebarCollapsed
                          ? skill.displayName || skill.name
                          : undefined
                      }
                      type="button"
                    >
                      <div className="flex items-start gap-2">
                        <FolderOpen
                          className={cn(
                            "h-4 w-4 shrink-0",
                            !sidebarCollapsed && "mt-0.5"
                          )}
                        />
                        {!sidebarCollapsed && (
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-sm">
                              {skill.displayName || skill.name}
                            </div>
                            <div className="truncate text-xs opacity-70">
                              {skill.description || "No description"}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle />

        {/* Skill Editor */}
        <Panel defaultSize="75%" minSize="60%">
          <div className="flex h-full min-w-0 flex-col overflow-hidden">
            {selectedSkillData ? (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b bg-background p-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsRawMode(false)}
                      size="sm"
                      variant={isRawMode ? "outline" : "default"}
                    >
                      <Pencil className="mr-1 h-4 w-4" weight="regular" />
                      Form
                    </Button>
                    <Button
                      onClick={() => setIsRawMode(true)}
                      size="sm"
                      variant={isRawMode ? "default" : "outline"}
                    >
                      <FileText className="mr-1 h-4 w-4" />
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
                  {isRawMode ? (
                    <TipTapEditor
                      className="min-h-full"
                      content={rawContent}
                      onChange={setRawContent}
                      placeholder="---\nname: skill-name\ndescription: Description of when to use this skill\n---\n\n# Skill Name\n\nAdd your skill instructions here..."
                    />
                  ) : (
                    <Form {...form}>
                      <form
                        className="space-y-4 p-4"
                        onSubmit={form.handleSubmit(handleSave)}
                      >
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name (internal ID)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="font-mono text-sm"
                                  placeholder="my-skill-name"
                                />
                              </FormControl>
                              <FormDescription>
                                Lowercase letters, numbers, and hyphens only.
                                Max 64 characters. Must match directory name.
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
                                <Textarea
                                  {...field}
                                  className="text-sm"
                                  placeholder="Describe what this skill does and when Claude should use it..."
                                  rows={3}
                                />
                              </FormControl>
                              <FormDescription>
                                Include both what the skill does AND when to
                                trigger it. Max 1024 characters.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="license"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License (optional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="text-sm"
                                  placeholder="MIT, Apache-2.0, or see LICENSE.txt"
                                />
                              </FormControl>
                              <FormDescription>
                                License name or reference to a bundled license
                                file.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="compatibility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Compatibility (optional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="text-sm"
                                  placeholder="e.g., Designed for Claude Code, Requires git and docker"
                                />
                              </FormControl>
                              <FormDescription>
                                Environment requirements or intended product.
                                Max 500 characters.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instructions</FormLabel>
                              <FormControl>
                                <TipTapEditor
                                  className="min-h-[400px]"
                                  content={field.value || ""}
                                  onChange={field.onChange}
                                  placeholder={`# Skill Name

Add detailed instructions for Claude here.

## When to use
- Describe scenarios where this skill is relevant
- Include specific trigger conditions
- Mention any prerequisites

## Instructions
- Step-by-step guidance
- Best practices
- Examples

## Additional Resources
You can add files to this skill directory:
- scripts/ - Executable code (Python, Bash, etc.)
- references/ - Documentation loaded on demand
- assets/ - Templates, images, data files

Reference files using relative paths: See [reference](references/REFERENCE.md)
`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="rounded-md border bg-muted/30 p-3">
                          <p className="text-muted-foreground text-xs">
                            <strong>Progressive Disclosure:</strong> Keep
                            SKILL.md under 500 lines. Move detailed reference
                            material to separate files in scripts/, references/,
                            or assets/.
                          </p>
                        </div>
                      </form>
                    </Form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Lightning
                    className="mx-auto mb-3 h-12 w-12 opacity-50"
                    weight="regular"
                  />
                  <p>Select a skill to edit</p>
                  <p className="mt-1 text-sm">
                    Or create a new skill to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default SkillsTab;
