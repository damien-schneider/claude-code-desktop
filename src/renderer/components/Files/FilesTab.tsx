import React, { useState, useEffect, useCallback } from 'react';
import {
  File,
  Folder,
  FolderOpen,
  CaretRight,
  FloppyDisk,
  Trash,
  Plus,
  PlusCircle,
  FileText,
  Code,
  Package,
  Image,
  FilmStrip,
  MusicNote,
  WarningCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { TipTapEditor } from '@/renderer/components/TipTapEditor';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useAtom, useSetAtom } from 'jotai';
import {
  selectedProjectIdAtom,
  isGlobalSettingsSelectedAtom,
  currentViewAtom,
  homePathAtom,
  homePathInitializedAtom,
  homePathLoadingAtom,
  initializeHomePathAtom,
} from '@/renderer/stores';
import { ipc } from '@/ipc/manager';
import type { ExplorerItem } from '@/ipc/claude/handlers';
import { cn } from '@/utils/tailwind';

interface FileNode extends ExplorerItem {
  children?: FileNode[];
  isExpanded?: boolean;
  level: number;
  loaded?: boolean;
}

const getFileIcon = (item: FileNode) => {
  if (item.type === 'directory') {
    return item.isExpanded ? FolderOpen : Folder;
  }

  const ext = item.extension?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(ext || '')) {
    return Image;
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) {
    return FilmStrip;
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext || '')) {
    return MusicNote;
  }
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext || '')) {
    return Package;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs'].includes(ext || '')) {
    return Code;
  }
  if (['md', 'txt', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg'].includes(ext || '')) {
    return FileText;
  }

  return File;
};

export const FilesTab: React.FC = () => {
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const [isGlobalSettingsSelected] = useAtom(isGlobalSettingsSelectedAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [homePath] = useAtom(homePathAtom);
  const [homeInitialized] = useAtom(homePathInitializedAtom);
  const [homeLoading] = useAtom(homePathLoadingAtom);
  const initializeHomePath = useSetAtom(initializeHomePathAtom);

  const [rootPath, setRootPath] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize home path once
  useEffect(() => {
    if (!homeInitialized && !homePath) {
      initializeHomePath();
    }
  }, [homeInitialized, homePath, initializeHomePath]);

  // Debug logging
  useEffect(() => {
    console.log('FilesTab state:', {
      selectedProjectId,
      isGlobalSettingsSelected,
      homePath,
      rootPath,
      fileTreeLength: fileTree.length,
    });
  }, [selectedProjectId, isGlobalSettingsSelected, homePath, rootPath, fileTree.length]);

  // Load a directory's contents
  const loadDirectoryContents = useCallback(async (dirPath: string): Promise<FileNode[]> => {
    console.log('Loading directory contents for:', dirPath);
    try {
      const result = await ipc.client.claude.readDirectory({ dirPath, includeHidden: true });
      console.log('Directory result:', result);
      return result.items.map(item => ({
        ...item,
        level: 0,
        isExpanded: false,
        loaded: false,
        children: item.type === 'directory' ? [] : undefined,
      }));
    } catch (error) {
      console.error('Failed to load directory:', error);
      return [];
    }
  }, []);

  // Recursively build the tree
  const buildTree = useCallback(async (basePath: string): Promise<FileNode[]> => {
    const items = await loadDirectoryContents(basePath);

    // For each directory, add an empty children array that will be loaded on expand
    return items.map(item => ({
      ...item,
      children: item.type === 'directory' ? [] : undefined,
    }));
  }, [loadDirectoryContents]);

  // Load tree - unified effect that handles all cases
  useEffect(() => {
    // Only load if we're on the files tab
    if (currentView !== 'files') return;

    const basePath = isGlobalSettingsSelected ? homePath : selectedProjectId || '';
    // For Files tab, show the .claude/ folder
    const claudePath = basePath ? `${basePath}/.claude` : '';

    if (!claudePath) {
      setFileTree([]);
      setRootPath('');
      return;
    }

    setRootPath(claudePath);
    buildTree(claudePath).then(setFileTree);
  }, [isGlobalSettingsSelected, selectedProjectId, homePath, currentView, buildTree]);

  const loadFileContent = useCallback(async (filePath: string) => {
    setLoading(true);
    try {
      const result = await ipc.client.claude.readFileContent({ filePath });
      if (result.exists) {
        setFileContent(result.content);
      } else {
        setFileContent('');
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      setFileContent('');
    } finally {
      setLoading(false);
    }
  }, []);

  // Expand/collapse directory and load its children if needed
  const toggleDirectory = async (node: FileNode, tree: FileNode[]): Promise<FileNode[]> => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(item => {
        if (item.path === node.path) {
          const isExpanded = !item.isExpanded;
          if (isExpanded && !item.loaded && item.type === 'directory') {
            // Load children
            loadDirectoryContents(item.path).then(children => {
              setFileTree(prev => updateNodeWithChildren(prev, node.path, children));
            });
            return { ...item, isExpanded: true, loaded: true };
          }
          return { ...item, isExpanded };
        }
        if (item.children) {
          return { ...item, children: updateNode(item.children) };
        }
        return item;
      });
    };

    return updateNode(tree);
  };

  const updateNodeWithChildren = (nodes: FileNode[], path: string, children: FileNode[]): FileNode[] => {
    return nodes.map(item => {
      if (item.path === path) {
        return { ...item, children, loaded: true };
      }
      if (item.children) {
        return { ...item, children: updateNodeWithChildren(item.children, path, children) };
      }
      return item;
    });
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.type === 'directory') {
      setFileTree(await toggleDirectory(node, fileTree));
    } else {
      setSelectedFile(node);
      await loadFileContent(node.path);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      const result = await ipc.client.claude.writeFileContent({ filePath: selectedFile.path, content: fileContent });
      if (result.success) {
        console.log('File saved successfully');
      } else {
        console.error('Failed to save file:', result.error);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFile = async () => {
    if (!rootPath) return;

    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    const filePath = `${rootPath}/${fileName}`;
    try {
      const result = await ipc.client.claude.createFile({ filePath, content: '' });
      if (result.success) {
        buildTree(rootPath).then(setFileTree);
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!rootPath) return;

    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const folderPath = `${rootPath}/${folderName}`;
    try {
      const result = await ipc.client.claude.createDirectory({ dirPath: folderPath });
      if (result.success) {
        buildTree(rootPath).then(setFileTree);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    if (confirm(`Are you sure you want to delete ${selectedFile.name}?`)) {
      try {
        const result = await ipc.client.claude.deleteItem({ itemPath: selectedFile.path });
        if (result.success) {
          setSelectedFile(null);
          setFileContent('');
          buildTree(rootPath).then(setFileTree);
        }
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const isEditableFile = (item: FileNode | null) => {
    if (!item || item.type === 'directory') return false;

    const ext = item.extension?.toLowerCase();
    const editableExts = [
      'md', 'txt', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg',
      'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs',
      'html', 'css', 'scss', 'less', 'svg', 'sh', 'bash', 'zsh',
      'env', 'example', 'gitignore', 'biomerc', 'jsonc'
    ];

    return editableExts.includes(ext || '') || !ext;
  };

  // Recursively render file tree
  const renderFileTree = (nodes: FileNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => {
      const Icon = getFileIcon(node);
      const isSelected = selectedFile?.path === node.path;
      const hasChildren = node.type === 'directory';

      return (
        <div key={node.path}>
          <div
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded-sm cursor-pointer hover:bg-muted/50 transition-colors text-sm',
              isSelected && 'bg-accent'
            )}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => handleFileClick(node)}
          >
            {hasChildren && (
              <CaretRight
                className={cn(
                  'h-3 w-3 transition-transform flex-shrink-0',
                  node.isExpanded && 'transform rotate-90'
                )}
                weight="regular"
              />
            )}
            {!hasChildren && <div className="w-3" />}
            <Icon className="h-4 w-4 flex-shrink-0" weight="regular" />
            <span className="flex-1 truncate">{node.name}</span>
            {node.type === 'file' && node.size && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {node.size < 1024 ? `${node.size}B` : node.size < 1024 * 1024 ? `${Math.round(node.size / 1024)}KB` : `${Math.round(node.size / (1024 * 1024))}MB`}
              </span>
            )}
          </div>
          {node.isExpanded && node.children && (
            <div>{renderFileTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const SelectedFileIconComponent = selectedFile ? getFileIcon(selectedFile) : File;

  // Show loading state while home path is being initialized
  if (homeLoading || (!homeInitialized && !homePath)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Loading workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* File Tree */}
      <ResizablePanel defaultSize={25} minSize={15} maxSize={40} className="border-r bg-muted/30 flex flex-col">
        {/* Header with path and create buttons */}
        <div className="p-3 border-b bg-background">
          <div className="text-xs text-muted-foreground truncate mb-2" title={rootPath}>
            {rootPath}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={handleCreateFile}>
              <Plus className="h-3 w-3 mr-1" weight="regular" />
              File
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={handleCreateFolder}>
              <Plus className="h-3 w-3 mr-1" weight="regular" />
              Folder
            </Button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && fileTree.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">Loading...</div>
          ) : fileTree.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" weight="regular" />
                <p className="text-sm">This folder is empty</p>
              </div>
            </div>
          ) : (
            renderFileTree(fileTree)
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* File Editor / Preview */}
      <ResizablePanel defaultSize={75} minSize={60}>
        {selectedFile ? (
          <div className="flex-1 flex flex-col h-full">
            {/* File Header */}
            <div className="p-3 border-b bg-background flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <SelectedFileIconComponent className="h-4 w-4 flex-shrink-0 text-muted-foreground" weight="regular" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{selectedFile.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{selectedFile.path}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {isEditableFile(selectedFile) && (
                  <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                    <FloppyDisk className="h-4 w-4 mr-1" weight="regular" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <Trash className="h-4 w-4 mr-1" weight="regular" />
                  Delete
                </Button>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-auto p-4">
              {isEditableFile(selectedFile) ? (
                loading ? (
                  <div className="text-sm text-muted-foreground text-center py-8">Loading file...</div>
                ) : (
                  <TipTapEditor
                    content={fileContent}
                    onChange={setFileContent}
                    placeholder="File content..."
                    className="min-h-full"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <File className="h-12 w-12 mx-auto mb-3 opacity-50" weight="regular" />
                    <p className="text-sm">This file type cannot be edited</p>
                    <p className="text-xs mt-1">Use an external editor for this file</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <File className="h-12 w-12 mx-auto mb-3 opacity-50" weight="regular" />
              <p>Select a file to view or edit</p>
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default FilesTab;
