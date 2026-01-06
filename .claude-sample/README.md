# Sample .claude Folder

This directory contains a comprehensive sample Claude Code configuration structure for testing and demonstration purposes.

## Directory Structure

```
.claude-sample/
├── commands/           # Custom slash commands
│   ├── git/           # Git-related commands
│   ├── testing/       # Testing commands
│   └── code-quality/  # Code quality commands
├── rules/            # Project rules and guidelines
├── skills/           # Reusable skills
├── hooks/            # Lifecycle hooks
├── agents/           # Specialized agents
└── README.md         # This file
```

## Components

### Commands (`.claude/commands/*.md`)

Custom slash commands that can be invoked with `/command-name`.

**Format:**
```markdown
---
description: Brief description
---

# Command Name

$ARGUMENTS

## Instructions
...
```

**Examples:**
- `/git:commit` - Create a conventional commit
- `/testing:run-tests` - Run test suite
- `/code-quality:lint` - Run linters

### Rules (`.claude/rules/*.md`)

Project-specific rules and guidelines that Claude should follow.

**Format:** Simple markdown files with rule descriptions.

### Skills (`.claude/skills/*.json`)

Reusable capabilities that can be invoked during conversations.

**Format:**
```json
{
  "name": "skill-name",
  "description": "What this skill does",
  "parameters": { ... },
  "content": "Skill instructions..."
}
```

### Hooks (`.claude/hooks/*.json`)

Lifecycle hooks that run at specific points during a session.

**Hook Types:**
- `SessionStart` - When a session starts
- `PromptSubmit` - When a prompt is submitted
- `ToolUse` - When a tool is used
- `ToolOutput` - After tool output
- `Response` - After receiving response
- `SessionEnd` - When session ends

**Format:**
```json
{
  "name": "hook-name",
  "enabled": true,
  "hookType": "SessionStart",
  "script": "// JavaScript code"
}
```

### Agents (`.claude/agents/*.md`)

Specialized agents for specific tasks.

**Format:**
```markdown
---
name: agent-name
description: When to use this agent
model: opus
color: blue
---

# Agent Name

Specialized instructions for this agent.
```

## Testing

This sample folder is used for unit testing the Claude Code Manager application to ensure:
- Commands are correctly loaded from subfolders
- Rules, skills, hooks, and agents are parsed correctly
- The UI displays all components properly
- CRUD operations work as expected
