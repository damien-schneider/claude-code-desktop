import React, { useState, useEffect } from 'react';
import { Plus, FloppyDisk, Trash, Lightning, FolderOpen, Pencil, FileText, PlusCircle } from '@phosphor-icons/react';
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
import { TipTapEditor } from '@/renderer/components/TipTapEditor';
import { useClaudeItems } from '../Hooks/useClaudeItems';
import { cn } from '@/utils/tailwind';
import { showError } from '@/renderer/lib/toast';
import {
  skillFormSchema,
  skillCreateSchema,
  type SkillFormValues,
  type SkillCreateValues,
} from '@/schemas/claude';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

interface Skill {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
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

const parseSkillFrontmatter = (content: string): { frontmatter?: SkillFrontmatter; body?: string } => {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!yamlMatch) return { body: content };

  try {
    const yaml = yamlMatch[1];
    const frontmatter: SkillFrontmatter = { name: '', description: '' };

    const nameMatch = yaml.match(/^name:\s*(.+)$/m);
    const descMatch = yaml.match(/^description:\s*(.+)$/m);
    const licenseMatch = yaml.match(/^license:\s*(.+)$/m);
    const compatMatch = yaml.match(/^compatibility:\s*(.+)$/m);

    if (nameMatch) frontmatter.name = nameMatch[1].trim();
    if (descMatch) frontmatter.description = descMatch[1].trim();
    if (licenseMatch) frontmatter.license = licenseMatch[1].trim();
    if (compatMatch) frontmatter.compatibility = compatMatch[1].trim();

    // Parse metadata field if present
    const metadataMatch = yaml.match(/^metadata:\s*\n((?:  .+\n?)+)/m);
    if (metadataMatch) {
      frontmatter.metadata = {};
      metadataMatch[1].split('\n').forEach(line => {
        const match = line.match(/^  (\w+):\s*(.+)$/);
        if (match) {
          frontmatter.metadata![match[1]] = match[2].trim();
        }
      });
    }

    return {
      frontmatter,
      body: content.replace(/^---\n[\s\S]*?\n---\n?/, '')
    };
  } catch {
    return { body: content };
  }
};

const buildSkillContent = (values: SkillFormValues): string => {
  const { name, description, license, compatibility, content = '' } = values;

  // Normalize the name
  const normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

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

  frontmatter += `---\n`;

  return `${frontmatter}\n${content}`;
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
  } = useClaudeItems({ type: 'skills', currentView: 'skills' });

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
  const [rawContent, setRawContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form for skill editing
  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: '',
      description: '',
      license: '',
      compatibility: '',
      content: '',
    },
  });

  // Form for creating new skill (name input)
  const createForm = useForm<SkillCreateValues>({
    resolver: zodResolver(skillCreateSchema),
    defaultValues: {
      name: '',
    },
  });

  // Load selected skill content into form
  useEffect(() => {
    if (!selectedSkill) {
      form.reset();
      setRawContent('');
      return;
    }

    const skill = skills.find((s) => s.path === selectedSkill);
    if (skill) {
      const parsed = parseSkillFrontmatter(skill.content);
      form.reset({
        name: parsed.frontmatter?.name || skill.name,
        description: parsed.frontmatter?.description || '',
        license: parsed.frontmatter?.license || '',
        compatibility: parsed.frontmatter?.compatibility || '',
        content: parsed.body || '',
      });
      setRawContent(skill.content);
    }
  }, [selectedSkill, skills, form]);

  const selectedSkillData = skills.find((s) => s.path === selectedSkill);

  const handleSave = async (values: SkillFormValues) => {
    if (!selectedSkill) return;

    setSaving(true);
    try {
      const skillContent = isRawMode
        ? rawContent
        : buildSkillContent(values);

      await saveItem(selectedSkill, skillContent);
      await loadItems();
    } catch (error) {
      console.error('Failed to save skill:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSkill) return;

    if (confirm('Are you sure you want to delete this skill?')) {
      const success = await deleteItem(selectedSkill);
      if (success) {
        setSelectedSkill(null);
      }
    }
  };

  const handleAdd = () => {
    if (!activePath) {
      showError('Cannot add skill', 'Please select a project or global settings first');
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
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Skills List */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40} className="border-r bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {/* Add Skill Button / Form */}
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
                                placeholder="my-skill-name (optional, leave empty for auto-name)"
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
                  title={!activePath ? "Select a project or global settings first" : "Add new skill"}
                >
                  <PlusCircle className="h-5 w-5" weight="regular" />
                  <span className="text-sm font-medium">Add Skill</span>
                </button>
              )}

              {/* Skills List */}
              {skills.length === 0 && !isAdding ? (
                <div className="flex items-center justify-center h-[calc(100%-60px)] text-muted-foreground">
                  <div className="text-center">
                    <Lightning className="h-8 w-8 mx-auto mb-2 opacity-50" weight="regular" />
                    <p className="text-sm">No skills found</p>
                    <p className="text-xs mt-1">Create skills to extend Claude</p>
                  </div>
                </div>
              ) : (
                skills.map((skill) => (
                  <div
                    key={skill.path}
                    className={cn(
                      'p-2 rounded-md cursor-pointer transition-colors',
                      selectedSkill === skill.path
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedSkill(skill.path)}
                  >
                    <div className="flex items-start gap-2">
                      <FolderOpen className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{skill.displayName || skill.name}</div>
                        <div className="text-xs opacity-70 truncate">{skill.description || 'No description'}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Skill Editor */}
        <ResizablePanel defaultSize={75} minSize={60}>
          <div className="flex-1 flex flex-col overflow-hidden h-full">
          {selectedSkillData ? (
            <>
              {/* Toolbar */}
              <div className="p-3 border-b bg-background flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isRawMode ? 'outline' : 'default'}
                    onClick={() => setIsRawMode(false)}
                  >
                    <Pencil className="h-4 w-4 mr-1" weight="regular" />
                    Form
                  </Button>
                  <Button
                    size="sm"
                    variant={isRawMode ? 'default' : 'outline'}
                    onClick={() => setIsRawMode(true)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
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
                    placeholder="---\nname: skill-name\ndescription: Description of when to use this skill\n---\n\n# Skill Name\n\nAdd your skill instructions here..."
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
                              <Input {...field} placeholder="my-skill-name" className="font-mono text-sm" />
                            </FormControl>
                            <FormDescription>
                              Lowercase letters, numbers, and hyphens only. Max 64 characters. Must match directory name.
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
                              <Textarea {...field} placeholder="Describe what this skill does and when Claude should use it..." rows={3} className="text-sm" />
                            </FormControl>
                            <FormDescription>
                              Include both what the skill does AND when to trigger it. Max 1024 characters.
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
                              <Input {...field} placeholder="MIT, Apache-2.0, or see LICENSE.txt" className="text-sm" />
                            </FormControl>
                            <FormDescription>
                              License name or reference to a bundled license file.
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
                              <Input {...field} placeholder="e.g., Designed for Claude Code, Requires git and docker" className="text-sm" />
                            </FormControl>
                            <FormDescription>
                              Environment requirements or intended product. Max 500 characters.
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
                                content={field.value || ''}
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
                                className="min-h-[400px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="p-3 bg-muted/30 rounded-md border">
                        <p className="text-xs text-muted-foreground">
                          <strong>Progressive Disclosure:</strong> Keep SKILL.md under 500 lines.
                          Move detailed reference material to separate files in scripts/, references/, or assets/.
                        </p>
                      </div>
                    </form>
                  </Form>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Lightning className="h-12 w-12 mx-auto mb-3 opacity-50" weight="regular" />
                <p>Select a skill to edit</p>
                <p className="text-sm mt-1">Or create a new skill to get started</p>
              </div>
            </div>
          )}
        </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SkillsTab;
