/**
 * TipTap Editor with Markdown support and slash commands
 *
 * Re-exports from the tip-tap-editor folder for backward compatibility.
 * The actual implementation is in ./tip-tap-editor/tip-tap-editor.tsx
 */

export { SlashCommand } from "./tip-tap-editor/slash-command-extension";
export { SlashCommandList } from "./tip-tap-editor/slash-command-list";
export { slashCommandSuggestion } from "./tip-tap-editor/slash-command-suggestion";
// Re-export TipTapEditor as default
export {
  TipTapEditor,
  TipTapEditor as default,
  type TipTapEditorRef,
} from "./tip-tap-editor/tip-tap-editor";
