# Settings Configuration Guide

This guide provides comprehensive documentation for configuring Claude Code Manager settings through the Settings tab.

## Overview

The Settings tab allows you to configure Claude Code Manager behavior through a visual interface. All settings are stored in `.claude/settings.json` within your project directory.

## Accessing Settings

1. Open Claude Code Manager
2. Select your project from the sidebar
3. Click on the Settings tab in the main content area

## Configuration Options

### 1. Theme Settings

Control the visual appearance of Claude Code Manager.

**Options:**
- **System** - Automatically adapts to your operating system's theme (default)
- **Light** - Forces light theme regardless of OS settings
- **Dark** - Forces dark theme regardless of OS settings

**How it works:**
- Theme changes are applied immediately without requiring a restart
- Your selection is saved to `settings.json` and persists across sessions
- When set to "System", the app will automatically switch between light and dark modes based on your OS preferences

### 2. Allowed Tools

Control which Claude Code tools are available during Claude Code sessions.

**Default Behavior:**
- When the list is empty, all tools are available (no restrictions)
- This is the recommended setting for most users

**Restricting Tools:**
To restrict specific tools, add them to the `allowedTools` array in `settings.json`:

```json
{
  "allowedTools": [
    "Read",
    "Write",
    "Edit",
    "Bash"
  ]
}
```

**Tool Patterns:**
You can use patterns to allow or block specific tools:
- `"Bash(git commit:*)"` - Allow only git commit commands
- `"Bash(git add:*)"` - Allow only git add commands
- `"Bash(bun run *)"` - Allow bun run commands

**Common Use Cases:**
- **Read-only mode**: `["Read", "Grep", "Glob"]`
- **Development mode**: `["Read", "Write", "Edit", "Bash", "Grep", "Glob"]`
- **Safe operations only**: `["Read", "Grep", "Glob"]` (no file modifications)

### 3. Model Preferences

Configure which AI models Claude Code uses for different operations.

**Structure:**
```json
{
  "modelPreferences": {
    "main": "claude-3-5-sonnet-20241022",
    "research": "perplexity-llama-3.1-sonar-large-128k-online",
    "fallback": "gpt-4o-mini"
  }
}
```

**Model Types:**

**Main Model**
- Used for most operations (code editing, file analysis, etc.)
- Default: `claude-3-5-sonnet-20241022`
- Recommended: Claude 3.5 Sonnet for best performance

**Research Model**
- Used for web search and research operations
- Default: `perplexity-llama-3.1-sonar-large-128k-online`
- Requires: `PERPLEXITY_API_KEY` in environment
- Recommended: Perplexity models for web research

**Fallback Model**
- Used when main model is unavailable or rate-limited
- Default: `gpt-4o-mini`
- Requires: `OPENAI_API_KEY` in environment
- Recommended: Faster, cheaper models for quick operations

**Supported Models:**
- **Anthropic**: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`
- **Google**: `gemini-1.5-pro`, `gemini-1.5-flash`
- **Mistral**: `mistral-large`, `mistral-medium`
- **Perplexity**: `perplexity-llama-3.1-sonar-large-128k-online`

## File Structure

The `settings.json` file follows this structure:

```json
{
  "allowedTools": [],
  "modelPreferences": {
    "main": "claude-3-5-sonnet-20241022",
    "research": "perplexity-llama-3.1-sonar-large-128k-online",
    "fallback": "gpt-4o-mini"
  },
  "theme": "system"
}
```

## JSON Editor

The Settings tab provides a split-view interface:

### Left Panel - JSON Editor
- Full Monaco editor with syntax highlighting
- Real-time JSON validation
- Error highlighting with line numbers
- Auto-formatting support
- Direct editing of `settings.json`

### Right Panel - Visual Configuration
- Theme dropdown selector
- Allowed tools list display
- Model preferences display
- Form-based editing (future enhancement)

## Saving Changes

1. Make changes in either the JSON editor or visual panel
2. Click the **Save** button in the top-right corner
3. Changes are validated before saving
4. Invalid JSON will prevent saving with error details
5. Valid changes are written to `.claude/settings.json`

## Reloading Settings

Click the **Reload** button to:
- Reload settings from disk
- Discard unsaved changes in the editor
- Sync with external edits to `settings.json`

## Validation

The Settings tab enforces JSON validation:

**Automatic Validation:**
- Real-time syntax checking in Monaco editor
- Red underlines for errors
- Line and column numbers for issues
- Error messages in the editor gutter

**Save Validation:**
- JSON must be valid before saving
- Schema validation (future enhancement)
- Clear error messages for invalid data

## Default Values

If `settings.json` doesn't exist or is missing fields, these defaults are used:

```json
{
  "allowedTools": [],
  "modelPreferences": {},
  "theme": "system"
}
```

## Common Configurations

### Development Environment
```json
{
  "allowedTools": [
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Grep",
    "Glob",
    "WebSearch"
  ],
  "modelPreferences": {
    "main": "claude-3-5-sonnet-20241022",
    "research": "perplexity-llama-3.1-sonar-large-128k-online",
    "fallback": "gpt-4o-mini"
  },
  "theme": "dark"
}
```

### Production/Review Environment
```json
{
  "allowedTools": [
    "Read",
    "Grep",
    "Glob"
  ],
  "modelPreferences": {
    "main": "claude-3-5-sonnet-20241022",
    "fallback": "gpt-4o-mini"
  },
  "theme": "system"
}
```

### Learning Environment
```json
{
  "allowedTools": [
    "Read",
    "Write",
    "Edit",
    "Grep",
    "Glob"
  ],
  "modelPreferences": {
    "main": "claude-3-5-sonnet-20241022",
    "fallback": "gpt-4o-mini"
  },
  "theme": "light"
}
```

## Troubleshooting

### Settings Not Saving
- Ensure you have write permissions for `.claude/settings.json`
- Check that JSON is valid (no syntax errors)
- Verify disk space is available

### Theme Not Applying
- Try reloading the application
- Check browser console for CSS errors
- Verify `theme` value is one of: `"light"`, `"dark"`, `"system"`

### Model Preferences Not Working
- Verify API keys are set in environment variables
- Check model names are valid and available
- Ensure you have API access for selected models
- Try switching to fallback model

### Invalid JSON Errors
- Look for red underlines in the editor
- Check for missing commas, brackets, or quotes
- Use a JSON linter or validator
- Copy error message and fix reported line/column

## Best Practices

1. **Start with defaults** - Begin with empty `allowedTools` and default theme
2. **Gradual restrictions** - Add tool restrictions only when needed
3. **Model selection** - Use Claude 3.5 Sonnet for best results
4. **API keys** - Keep API keys secure, never commit them
5. **Backup settings** - Copy working configurations before major changes
6. **Test changes** - Verify settings work as expected after saving
7. **Document custom configs** - Note why you chose specific settings

## Integration with Claude Code

Settings configured here affect:
- **Tool availability** during Claude Code sessions
- **Model selection** for AI operations
- **Theme** for the entire Claude Code Manager interface
- **Behavior** of file operations and validations

## Future Enhancements

Planned features for the Settings tab:
- Form-based editing for all settings
- Environment variables editor
- Advanced tool pattern builder
- Model comparison tool
- Settings import/export
- Configuration templates
- Per-project settings profiles
- Settings validation against schema

## Related Documentation

- [Hooks Configuration Guide](./hooks-configuration.md)
- [Rules Configuration Guide](./rules-configuration.md)
- [Skills Configuration Guide](./skills-configuration.md)
- [MCP Servers Configuration Guide](./mcp-configuration.md)

## Support

For issues or questions:
1. Check this documentation first
2. Review the JSON error messages carefully
3. Test with default settings
4. Check application logs
5. Report bugs with full error messages and configuration

---

**Last Updated:** 2025-12-27
**Version:** 1.0.0
