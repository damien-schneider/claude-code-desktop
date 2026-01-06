import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MagnifyingGlass, Folder, FileText, GitBranch, Sparkle, Users, Code, Wrench, Gear, Database, X, Command } from '@phosphor-icons/react';
import { useAtom } from 'jotai';
import {
  currentViewAtom,
  projectsAtom,
  setCurrentViewAtom,
  selectProjectAtom,
  selectGlobalSettingsAtom,
  homePathAtom,
  isGlobalSettingsSelectedAtom,
  type NavigationView,
} from '@/renderer/stores';
import { cn } from '@/utils/tailwind';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export interface QuickOpenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuickOpenItem {
  id: string;
  type: 'view' | 'project' | 'global';
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  action: () => void;
}

// View items with icons
const VIEW_ITEMS = [
  { id: 'files', label: 'Files', icon: Folder, keywords: ['file', 'explore', 'directory'] },
  { id: 'claudemd', label: 'CLAUDE.md', icon: FileText, keywords: ['claude', 'instructions', 'readme'] },
  { id: 'rules', label: 'Rules', icon: GitBranch, keywords: ['rule', 'guidelines'] },
  { id: 'skills', label: 'Skills', icon: Sparkle, keywords: ['skill', 'capability'] },
  { id: 'agents', label: 'Agents', icon: Users, keywords: ['agent', 'ai'] },
  { id: 'commands', label: 'Commands', icon: Code, keywords: ['command', 'cli'] },
  { id: 'hooks', label: 'Hooks', icon: Wrench, keywords: ['hook', 'event'] },
  { id: 'settings', label: 'Settings', icon: Gear, keywords: ['setting', 'config', 'preference'] },
  { id: 'mcp', label: 'MCP Servers', icon: Database, keywords: ['mcp', 'server'] },
];

export const QuickOpenDialog: React.FC<QuickOpenDialogProps> = ({ open, onOpenChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [currentView] = useAtom(currentViewAtom);
  const [projects] = useAtom(projectsAtom);
  const [homePath] = useAtom(homePathAtom);
  const [isGlobalSettingsSelected] = useAtom(isGlobalSettingsSelectedAtom);

  const [, setCurrentView] = useAtom(setCurrentViewAtom);
  const [, selectProject] = useAtom(selectProjectAtom);
  const [, selectGlobalSettings] = useAtom(selectGlobalSettingsAtom);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedIndex(0);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Build all searchable items
  const items = useMemo((): QuickOpenItem[] => {
    const result: QuickOpenItem[] = [];

    // Add view navigation items
    VIEW_ITEMS.forEach((view) => {
      if (view.id !== currentView) {
        result.push({
          id: `view-${view.id}`,
          type: 'view',
          label: view.label,
          sublabel: 'Navigate to',
          icon: view.icon,
          keywords: view.keywords,
          action: () => setCurrentView(view.id as NavigationView),
        });
      }
    });

    // Add Global Settings
    if (!isGlobalSettingsSelected) {
      result.push({
        id: 'global',
        type: 'global',
        label: 'Global Settings',
        sublabel: homePath ? '~/.claude/' : 'Personal Config',
        icon: Gear,
        keywords: ['global', 'settings', 'config', 'personal', 'home', '~'],
        action: () => selectGlobalSettings(),
      });
    }

    // Add projects
    projects.forEach((project) => {
      result.push({
        id: `project-${project.path}`,
        type: 'project',
        label: project.name,
        sublabel: project.path,
        icon: Folder,
        keywords: [project.name, project.path, ...(project.hasClaudeConfig ? ['claude'] : [])],
        action: () => selectProject(project.path),
      });
    });

    return result;
  }, [projects, currentView, homePath, isGlobalSettingsSelected, setCurrentView, selectProject, selectGlobalSettings]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items.slice(0, 8); // Limit to 8 items when no search
    }

    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const labelMatch = item.label.toLowerCase().includes(query);
      const sublabelMatch = item.sublabel?.toLowerCase().includes(query);
      const keywordMatch = item.keywords.some((k) => k.toLowerCase().includes(query));
      return labelMatch || sublabelMatch || keywordMatch;
    }).slice(0, 8); // Limit results
  }, [items, searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredItems.length > 0) {
      e.preventDefault();
      filteredItems[selectedIndex]?.action();
      onOpenChange(false);
    }
  }, [filteredItems, selectedIndex, onOpenChange]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl gap-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <MagnifyingGlass className="h-5 w-5 text-muted-foreground" weight="regular" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects, views, settings..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-muted-foreground bg-muted rounded">
              <Command className="h-3 w-3" weight="regular" />
              K
            </kbd>
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <MagnifyingGlass className="h-10 w-10 mx-auto mb-3 opacity-50" weight="regular" />
                <p className="text-sm">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="px-2">
                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onOpenChange(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-accent'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        {item.sublabel && (
                          <div className="text-xs text-muted-foreground truncate">{item.sublabel}</div>
                        )}
                      </div>
                      {item.type === 'view' && (
                        <kbd className="hidden sm:inline-flex min-w-[2rem] px-1.5 py-0.5 text-xs font-mono text-muted-foreground bg-muted rounded">
                          {VIEW_ITEMS.findIndex(v => v.id === item.id.replace('view-', '')) + 1}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 font-mono bg-background rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 font-mono bg-background rounded">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 font-mono bg-background rounded">esc</kbd>
                  Close
                </span>
              </div>
              <span>{selectedIndex + 1} of {filteredItems.length}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickOpenDialog;
