# Claude Code Manager - PRD

## Project Overview
Create a desktop application to manage all Claude Code configuration across multiple projects on a computer. The app provides a unified UI interface to manage hooks, rules, agents, skills, and settings.

## Core Features

### 1. Project Discovery & Selection
- **Sidebar Navigation**: Tree-view of all git projects on the computer
- **Main Config Option**: Access to global Claude Code configuration (~/.claude/)
- **Project Detection**: Automatic scanning for .claude/ directories in git repositories
- **Filter/Search**: Quick search across all projects
- **Favorites**: Mark frequently accessed projects

### 2. Multi-Tab Management Interface
Each selected project/main config opens tabs for managing different aspects:

**Tab 1: Hooks Management**
- List all hooks (SessionStart, PromptSubmit, ToolUse, etc.)
- Create/Edit/Delete hooks
- Enable/Disable toggles
- Hook script editor with syntax highlighting
- Test hook execution
- Import/Export hooks

**Tab 2: Rules Management**
- List all rules in .claude/rules
- Create/Edit/Delete rules
- Rule editor with markdown support
- Preview rule rendering
- Enable/Disable individual rules
- Rule priority ordering
- Import/Export rules

**Tab 3: Skills Management**
- List all custom skills
- Create/Edit/Delete skills
- Skill metadata editor (name, description, parameters)
- Skill content editor
- Test skill execution
- Skill validation
- Import/Export skills

**Tab 4: Agents/MCP Management**
- List all configured MCP servers
- Add/Remove/Edit MCP configurations
- Test MCP connections
- View available tools per server
- MCP server health monitoring
- Import/Export MCP configs

**Tab 5: Settings & Configuration**
- Edit .claude/settings.json with JSON validation
- Allowed tools configuration
- Model preferences
- Environment variables
- Theme/appearance settings

### 3. Cross-Project Operations
- **Bulk Operations**: Apply hooks/rules/skills to multiple projects
- **Templates**: Save configurations as templates for reuse
- **Sync**: Copy configurations between projects
- **Migration**: Move configurations from one project to another

### 4. Additional Features
- **Version Control Integration**: Git diff for configuration changes
- **Backup/Restore**: Automatic backups before modifications
- **Configuration Validation**: JSON/YAML syntax checking
- **Search**: Global search across all configurations
- **Activity Log**: Track all configuration changes
- **Import/Export**: Backup entire configuration or individual components

## Technical Requirements

### Technology Stack
- **Framework**: Electron with React + TypeScript
- **UI Library**: shadcn/ui components (this is electron-shadcn template)
- **State Management**: React Context or Zustand
- **File System**: Node.js fs/promises for config file operations
- **Editor**: Monaco Editor or CodeMirror for code editing
- **Styling**: Tailwind CSS

### Architecture
- **Main Process**: File system operations, git integration
- **Renderer Process**: UI rendering, user interactions
- **IPC Communication**: Secure bridge between main/renderer

### File Structure
```
src/
├── main/                    # Electron main process
│   ├── ipc/                # IPC handlers
│   ├── git/                # Git operations
│   ├── config/             # Config file operations
│   └── scanner/            # Project scanner
├── renderer/               # React app
│   ├── components/
│   │   ├── Sidebar/       # Project navigation
│   │   ├── Tabs/          # Tab management
│   │   ├── Hooks/         # Hooks management UI
│   │   ├── Rules/         # Rules management UI
│   │   ├── Skills/        # Skills management UI
│   │   ├── Agents/        # MCP management UI
│   │   └── Settings/      # Settings UI
│   ├── hooks/             # React hooks
│   ├── stores/            # State management
│   └── utils/             # Utilities
└── shared/                # Shared types/constants
```

## Success Criteria
1. Users can discover all git projects with .claude/ directories
2. Users can view and edit all Claude Code configuration types
3. Users can perform bulk operations across multiple projects
4. All file operations are safe with automatic backups
5. UI is responsive and intuitive

## Future Enhancements (Phase 2)
- Cloud sync for configurations
- Collaboration features
- Configuration marketplace
- AI assistance for creating hooks/rules/skills
- Analytics and usage insights
