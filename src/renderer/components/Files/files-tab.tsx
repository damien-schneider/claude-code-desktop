import {
  CaretRight,
  Code,
  File,
  FileText,
  FilmStrip,
  FloppyDisk,
  Folder,
  FolderOpen,
  Image,
  MusicNote,
  Package,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { useAtom, useSetAtom } from "jotai";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabLayout } from "@/components/ui/tab-layout";
import type { ExplorerItem } from "@/ipc/claude/handlers";
import { ipc } from "@/ipc/manager";
import { TipTapEditor } from "@/renderer/components/tip-tap-editor";
import {
  currentViewAtom,
  homePathAtom,
  homePathInitializedAtom,
  homePathLoadingAtom,
  initializeHomePathAtom,
  isGlobalSettingsSelectedAtom,
  selectedProjectIdAtom,
} from "@/renderer/stores";
import { cn } from "@/utils/tailwind";

interface FileNode extends ExplorerItem {
  children?: FileNode[];
  isExpanded?: boolean;
  level: number;
  loaded?: boolean;
}

const getFileIcon = (item: FileNode) => {
  if (item.type === "directory") {
    return item.isExpanded ? FolderOpen : Folder;
  }

  const ext = item.extension?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "ico"].includes(ext || "")) {
    return Image;
  }
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext || "")) {
    return FilmStrip;
  }
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext || "")) {
    return MusicNote;
  }
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext || "")) {
    return Package;
  }
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "rb",
      "go",
      "rs",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
    ].includes(ext || "")
  ) {
    return Code;
  }
  if (
    ["md", "txt", "json", "xml", "yaml", "yml", "toml", "ini", "cfg"].includes(
      ext || ""
    )
  ) {
    return FileText;
  }

  return File;
};

const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)}KB`;
  }
  return `${Math.round(size / (1024 * 1024))}MB`;
};

interface FileListContentProps {
  fileTree: FileNode[];
  loading: boolean;
  renderFileTree: (nodes: FileNode[], level?: number) => React.ReactNode;
}

const FileListContent: React.FC<FileListContentProps> = ({
  fileTree,
  loading,
  renderFileTree,
}) => {
  if (loading && fileTree.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Folder
            className="mx-auto mb-2 h-8 w-8 opacity-50"
            weight="regular"
          />
          <p className="text-sm">This folder is empty</p>
        </div>
      </div>
    );
  }

  return <>{renderFileTree(fileTree)}</>;
};

interface FileContentProps {
  selectedFile: FileNode | null;
  loading: boolean;
  fileContent: string;
  isEditableFile: (item: FileNode | null) => boolean;
  onContentChange: (content: string) => void;
}

const FileContent: React.FC<FileContentProps> = ({
  selectedFile,
  loading,
  fileContent,
  isEditableFile,
  onContentChange,
}) => {
  if (!selectedFile) {
    return null;
  }

  if (!isEditableFile(selectedFile)) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <File
            className="mx-auto mb-3 h-12 w-12 opacity-50"
            weight="regular"
          />
          <p className="text-sm">This file type cannot be edited</p>
          <p className="mt-1 text-xs">Use an external editor for this file</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Loading file...
      </div>
    );
  }

  return (
    <TipTapEditor
      className="min-h-full"
      content={fileContent}
      onChange={onContentChange}
      placeholder="File content..."
    />
  );
};

export const FilesTab: React.FC = () => {
  const [selectedProjectId] = useAtom(selectedProjectIdAtom);
  const [isGlobalSettingsSelected] = useAtom(isGlobalSettingsSelectedAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [homePath] = useAtom(homePathAtom);
  const [homeInitialized] = useAtom(homePathInitializedAtom);
  const [homeLoading] = useAtom(homePathLoadingAtom);
  const initializeHomePath = useSetAtom(initializeHomePathAtom);

  const [rootPath, setRootPath] = useState<string>("");
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize home path once
  useEffect(() => {
    if (!(homeInitialized || homePath)) {
      initializeHomePath();
    }
  }, [homeInitialized, homePath, initializeHomePath]);

  // Debug logging
  useEffect(() => {
    console.log("FilesTab state:", {
      selectedProjectId,
      isGlobalSettingsSelected,
      homePath,
      rootPath,
      fileTreeLength: fileTree.length,
    });
  }, [
    selectedProjectId,
    isGlobalSettingsSelected,
    homePath,
    rootPath,
    fileTree.length,
  ]);

  // Load a directory's contents
  const loadDirectoryContents = useCallback(
    async (dirPath: string): Promise<FileNode[]> => {
      console.log("Loading directory contents for:", dirPath);
      try {
        const result = await ipc.client.claude.readDirectory({
          dirPath,
          includeHidden: true,
        });
        console.log("Directory result:", result);
        return result.items.map((item) => ({
          ...item,
          level: 0,
          isExpanded: false,
          loaded: false,
          children: item.type === "directory" ? [] : undefined,
        }));
      } catch (error) {
        console.error("Failed to load directory:", error);
        return [];
      }
    },
    []
  );

  // Recursively build the tree
  const buildTree = useCallback(
    async (basePath: string): Promise<FileNode[]> => {
      const items = await loadDirectoryContents(basePath);

      // For each directory, add an empty children array that will be loaded on expand
      return items.map((item) => ({
        ...item,
        children: item.type === "directory" ? [] : undefined,
      }));
    },
    [loadDirectoryContents]
  );

  // Load tree - unified effect that handles all cases
  useEffect(() => {
    // Only load if we're on the files tab
    if (currentView !== "files") {
      return;
    }

    const basePath = isGlobalSettingsSelected
      ? homePath
      : selectedProjectId || "";
    // For Files tab, show the .claude/ folder
    const claudePath = basePath ? `${basePath}/.claude` : "";

    if (!claudePath) {
      setFileTree([]);
      setRootPath("");
      return;
    }

    setRootPath(claudePath);
    buildTree(claudePath).then(setFileTree);
  }, [
    isGlobalSettingsSelected,
    selectedProjectId,
    homePath,
    currentView,
    buildTree,
  ]);

  const loadFileContent = useCallback(async (filePath: string) => {
    setLoading(true);
    try {
      const result = await ipc.client.claude.readFileContent({ filePath });
      if (result.exists) {
        setFileContent(result.content);
      } else {
        setFileContent("");
      }
    } catch (error) {
      console.error("Failed to load file:", error);
      setFileContent("");
    } finally {
      setLoading(false);
    }
  }, []);

  // Expand/collapse directory and load its children if needed
  const toggleDirectory = (node: FileNode, tree: FileNode[]): FileNode[] => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((item) => {
        if (item.path === node.path) {
          const isExpanded = !item.isExpanded;
          if (isExpanded && !item.loaded && item.type === "directory") {
            // Load children
            // biome-ignore lint/complexity/noVoid: Fire and forget async operation
            void loadDirectoryContents(item.path).then((children) => {
              setFileTree((prev) =>
                updateNodeWithChildren(prev, node.path, children)
              );
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

  const updateNodeWithChildren = (
    nodes: FileNode[],
    path: string,
    children: FileNode[]
  ): FileNode[] => {
    return nodes.map((item) => {
      if (item.path === path) {
        return { ...item, children, loaded: true };
      }
      if (item.children) {
        return {
          ...item,
          children: updateNodeWithChildren(item.children, path, children),
        };
      }
      return item;
    });
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.type === "directory") {
      setFileTree(await toggleDirectory(node, fileTree));
    } else {
      setSelectedFile(node);
      await loadFileContent(node.path);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      return;
    }

    setSaving(true);
    try {
      const result = await ipc.client.claude.writeFileContent({
        filePath: selectedFile.path,
        content: fileContent,
      });
      if (result.success) {
        console.log("File saved successfully");
      } else {
        console.error("Failed to save file:", result.error);
      }
    } catch (error) {
      console.error("Failed to save file:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFile = async () => {
    if (!rootPath) {
      return;
    }

    // biome-ignore lint/suspicious/noAlert: Replacing with modal is out of scope
    const fileName = prompt("Enter file name:");
    if (!fileName) {
      return;
    }

    const filePath = `${rootPath}/${fileName}`;
    try {
      const result = await ipc.client.claude.createFile({
        filePath,
        content: "",
      });
      if (result.success) {
        // biome-ignore lint/complexity/noVoid: Fire and forget async operation
        void buildTree(rootPath).then(setFileTree);
      }
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!rootPath) {
      return;
    }

    // biome-ignore lint/suspicious/noAlert: Replacing with modal is out of scope
    const folderName = prompt("Enter folder name:");
    if (!folderName) {
      return;
    }

    const folderPath = `${rootPath}/${folderName}`;
    try {
      const result = await ipc.client.claude.createDirectory({
        dirPath: folderPath,
      });
      if (result.success) {
        buildTree(rootPath).then(setFileTree);
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) {
      return;
    }

    // biome-ignore lint/suspicious/noAlert: Replacing with modal is out of scope
    if (confirm(`Are you sure you want to delete ${selectedFile.name}?`)) {
      try {
        const result = await ipc.client.claude.deleteItem({
          itemPath: selectedFile.path,
        });
        if (result.success) {
          setSelectedFile(null);
          setFileContent("");
          // biome-ignore lint/complexity/noVoid: Fire and forget async operation
          void buildTree(rootPath).then(setFileTree);
        }
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };

  const isEditableFile = (item: FileNode | null) => {
    if (!item || item.type === "directory") {
      return false;
    }

    const ext = item.extension?.toLowerCase();
    const editableExts = [
      "md",
      "txt",
      "json",
      "xml",
      "yaml",
      "yml",
      "toml",
      "ini",
      "cfg",
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "rb",
      "go",
      "rs",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
      "html",
      "css",
      "scss",
      "less",
      "svg",
      "sh",
      "bash",
      "zsh",
      "env",
      "example",
      "gitignore",
      "biomerc",
      "jsonc",
    ];

    return editableExts.includes(ext || "") || !ext;
  };

  // Recursively render file tree
  const renderFileTree = (nodes: FileNode[], level = 0): React.ReactNode => {
    return nodes.map((node) => {
      const Icon = getFileIcon(node);
      const isSelected = selectedFile?.path === node.path;
      const hasChildren = node.type === "directory";

      return (
        <div key={node.path}>
          <button
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-left text-sm transition-colors hover:bg-muted/50",
              isSelected && "bg-accent"
            )}
            onClick={() => handleFileClick(node)}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            type="button"
          >
            {hasChildren && (
              <CaretRight
                className={cn(
                  "h-3 w-3 shrink-0 transition-transform",
                  node.isExpanded && "rotate-90 transform"
                )}
                weight="regular"
              />
            )}
            {!hasChildren && <div className="w-3" />}
            <Icon className="h-4 w-4 shrink-0" weight="regular" />
            <span className="flex-1 truncate">{node.name}</span>
            {node.type === "file" && node.size && (
              <span className="shrink-0 text-muted-foreground text-xs">
                {formatFileSize(node.size)}
              </span>
            )}
          </button>
          {node.isExpanded && node.children && (
            <div>{renderFileTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const SelectedFileIconComponent = selectedFile
    ? getFileIcon(selectedFile)
    : File;

  // Show loading state while home path is being initialized
  if (homeLoading || !(homeInitialized || homePath)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground text-sm">
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  return (
    <TabLayout
      main={
        <div className="flex h-full min-w-0 flex-col overflow-hidden">
          {selectedFile ? (
            <div className="flex h-full flex-1 flex-col">
              {/* File Header */}
              <div className="flex items-center justify-between border-b bg-background p-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <SelectedFileIconComponent
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    weight="regular"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">
                      {selectedFile.name}
                    </div>
                    <div className="truncate text-muted-foreground text-xs">
                      {selectedFile.path}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditableFile(selectedFile) && (
                    <Button
                      disabled={saving}
                      onClick={handleSave}
                      size="sm"
                      variant="outline"
                    >
                      <FloppyDisk className="mr-1 h-4 w-4" weight="regular" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  )}
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

              {/* File Content */}
              <div className="flex-1 overflow-auto p-4">
                <FileContent
                  fileContent={fileContent}
                  isEditableFile={isEditableFile}
                  loading={loading}
                  onContentChange={setFileContent}
                  selectedFile={selectedFile}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <File
                  className="mx-auto mb-3 h-12 w-12 opacity-50"
                  weight="regular"
                />
                <p>Select a file to view or edit</p>
              </div>
            </div>
          )}
        </div>
      }
      sidebar={
        <div className="flex h-full flex-col">
          {/* Header with path and create buttons */}
          <div className="p-3">
            <div
              className="mb-2 truncate text-muted-foreground text-xs"
              title={rootPath}
            >
              {rootPath}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleCreateFile}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-1 h-3 w-3" weight="regular" />
                File
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateFolder}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-1 h-3 w-3" weight="regular" />
                Folder
              </Button>
            </div>
          </div>

          {/* File List */}
          <ScrollArea>
            <FileListContent
              fileTree={fileTree}
              loading={loading}
              renderFileTree={(nodes, level) => renderFileTree(nodes, level)}
            />
          </ScrollArea>
        </div>
      }
    />
  );
};

export default FilesTab;
