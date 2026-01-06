import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleNotch,
  Lightning,
  PlusCircle,
  Trash,
} from "@phosphor-icons/react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { showError } from "@/renderer/lib/toast";
import { cn } from "@/renderer/lib/utils";
import {
  type SkillCreateValues,
  type SkillFormValues,
  skillCreateSchema,
  skillFormSchema,
} from "@/schemas/claude";
import { useClaudeItems } from "../hooks/use-claude-items";

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

const YAML_FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
const NAME_PATTERN_REGEX = /^name:\s*(.+)$/m;
const DESCRIPTION_PATTERN_REGEX = /^description:\s*(.+)$/m;
const LICENSE_PATTERN_REGEX = /^license:\s*(.+)$/m;
const COMPATIBILITY_PATTERN_REGEX = /^compatibility:\s*(.+)$/m;
const METADATA_PATTERN_REGEX = /^metadata:\s*\n((?: {2}.+\n?)+)/m;
const METADATA_LINE_REGEX = /^ {2}(\w+):\s*(.+)$/;

const parseSkillFrontmatter = (
  content: string
): { frontmatter?: SkillFrontmatter; body?: string } => {
  const yamlMatch = content.match(YAML_FRONTMATTER_REGEX);
  if (!yamlMatch) {
    return { body: content };
  }

  try {
    const yaml = yamlMatch[1];
    const frontmatter: SkillFrontmatter = { name: "", description: "" };

    const nameMatch = yaml.match(NAME_PATTERN_REGEX);
    const descMatch = yaml.match(DESCRIPTION_PATTERN_REGEX);
    const licenseMatch = yaml.match(LICENSE_PATTERN_REGEX);
    const compatMatch = yaml.match(COMPATIBILITY_PATTERN_REGEX);

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
    const metadataMatch = yaml.match(METADATA_PATTERN_REGEX);
    if (metadataMatch) {
      const metadata: Record<string, string> = {};
      for (const line of metadataMatch[1].split("\n")) {
        const match = line.match(METADATA_LINE_REGEX);
        if (match) {
          metadata[match[1]] = match[2].trim();
        }
      }
      frontmatter.metadata = metadata;
    }

    return {
      frontmatter,
      body: content.replace(YAML_FRONTMATTER_REGEX, ""),
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

const SkillSidebar: React.FC<SkillSidebarProps> = ({
  loading,
  activePath,
  skills,
  isAdding,
  selectedSkill,
  onAdd,
  onConfirmAdd,
  onCancelAdd,
  onSelect,
  createForm,
}) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold text-sm">Skills</h2>
        <Button
          disabled={loading || !activePath}
          onClick={onAdd}
          size="icon"
          variant="ghost"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 p-2">
          {loading && skills.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Loading skills...
            </div>
          ) : (
            <>
              {isAdding && (
                <div className="px-2 py-4">
                  <Form {...createForm}>
                    <form
                      className="space-y-4"
                      onSubmit={createForm.handleSubmit(onConfirmAdd)}
                    >
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                autoFocus
                                placeholder="Skill name (e.g., git-branch)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          type="submit"
                          variant="secondary"
                        >
                          Create
                        </Button>
                        <Button
                          onClick={onCancelAdd}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              {skills.map((skill) => (
                <button
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                    selectedSkill === skill.path && "bg-accent"
                  )}
                  key={skill.path}
                  onClick={() => onSelect(skill.path)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-sm">
                      {skill.displayName || skill.name}
                    </span>
                  </div>
                  {skill.description && (
                    <span className="line-clamp-2 text-muted-foreground text-xs">
                      {skill.description}
                    </span>
                  )}
                </button>
              ))}

              {!loading && skills.length === 0 && !isAdding && (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No skills found
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface SkillEditorProps {
  selectedSkill: string | null;
  selectedSkillData: Skill | undefined;
  isRawMode: boolean;
  setIsRawMode: (raw: boolean) => void;
  saving: boolean;
  onSave: (values: SkillFormValues) => void;
  onDelete: () => void;
  rawContent: string;
  setRawContent: (content: string) => void;
  form: ReturnType<typeof useForm<SkillFormValues>>;
}

const SkillEditor: React.FC<SkillEditorProps> = ({
  selectedSkillData,
  isRawMode,
  setIsRawMode,
  saving,
  onSave,
  onDelete,
  rawContent,
  setRawContent,
  form,
}) => {
  if (!selectedSkillData) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Lightning
            className="mx-auto mb-3 h-12 w-12 opacity-50"
            weight="regular"
          />
          <p>Select a skill to edit</p>
          <p className="mt-1 text-sm">Or create a new skill to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {selectedSkillData.type === "global" ? "Global" : "Project"}
          </Badge>
          <span className="truncate font-medium text-sm">
            {selectedSkillData.path}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              isRawMode
                ? "hover:bg-accent"
                : "bg-primary text-primary-foreground"
            )}
            onClick={() => setIsRawMode(false)}
            type="button"
          >
            Editor
          </button>
          <button
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              isRawMode
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
            onClick={() => setIsRawMode(true)}
            type="button"
          >
            Raw
          </button>
          <Separator className="h-4" orientation="vertical" />
          <Button
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            size="icon"
            variant="ghost"
          >
            <Trash className="h-4 w-4" />
          </Button>
          <Button
            disabled={saving}
            onClick={form.handleSubmit((v) => onSave(v))}
            size="sm"
          >
            {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isRawMode ? (
          <div className="h-full font-mono text-sm leading-relaxed">
            <textarea
              className="h-full w-full resize-none border-none bg-transparent outline-none"
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Paste skill content here..."
              value={rawContent}
            />
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSave)}>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Human friendly name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="license"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MIT, UNLICENSED" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What does this skill do?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compatibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compatibility</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., node >= 18, macOS" {...field} />
                    </FormControl>
                    <FormDescription>
                      System or environment requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Implementation (Bash)</FormLabel>
                    <FormControl>
                      <textarea
                        className="min-h-[300px] w-full resize-y rounded-md border bg-transparent p-3 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
                        placeholder="# Your skill logic here..."
                        {...field}
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
    </div>
  );
};

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

  const handleSave = useCallback(
    async (values: SkillFormValues) => {
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
    },
    [selectedSkill, isRawMode, rawContent, saveItem, loadItems]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedSkill) {
      return;
    }

    // biome-ignore lint/suspicious/noAlert: browser confirm is used for simple deletion confirmation
    if (window.confirm("Are you sure you want to delete this skill?")) {
      const success = await deleteItem(selectedSkill);
      if (success) {
        setSelectedSkill(null);
      }
    }
  }, [selectedSkill, deleteItem]);

  const handleAdd = useCallback(() => {
    if (!activePath) {
      showError(
        "Cannot add skill",
        "Please select a project or global settings first"
      );
      return;
    }
    setIsAdding(true);
    createForm.reset();
  }, [activePath, createForm]);

  const handleConfirmAdd = useCallback(
    async (values: SkillCreateValues) => {
      const result = await createItem(values.name);

      if (result.success && result.path) {
        setSelectedSkill(result.path);
        setIsAdding(false);
        createForm.reset();
      }
    },
    [createItem, createForm]
  );

  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    createForm.reset();
  }, [createForm]);

  return (
    <div className="flex h-full flex-col">
      {/* Main Content */}
      <ResizablePanelGroup
        className="flex-1 overflow-hidden"
        direction="horizontal"
      >
        {/* Skills List */}
        <ResizablePanel
          className="border-r bg-muted/30"
          defaultSize={25}
          maxSize={40}
          minSize={15}
        >
          <SkillSidebar
            activePath={activePath}
            createForm={createForm}
            isAdding={isAdding}
            loading={loading}
            onAdd={handleAdd}
            onCancelAdd={handleCancelAdd}
            onConfirmAdd={handleConfirmAdd}
            onSelect={setSelectedSkill}
            selectedSkill={selectedSkill}
            skills={skills}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Skill Editor */}
        <ResizablePanel defaultSize={75} minSize={60}>
          <SkillEditor
            form={form}
            isRawMode={isRawMode}
            onDelete={handleDelete}
            onSave={handleSave}
            rawContent={rawContent}
            saving={saving}
            selectedSkill={selectedSkill}
            selectedSkillData={selectedSkillData}
            setIsRawMode={setIsRawMode}
            setRawContent={setRawContent}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SkillsTab;
