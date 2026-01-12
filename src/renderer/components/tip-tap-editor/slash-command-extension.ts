import type { Editor, Range } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";
import Suggestion from "@tiptap/suggestion";

import { type SlashCommandItem, slashCommands } from "./slash-command-list";

export interface SlashCommandOptions {
  suggestion: Omit<SuggestionOptions<SlashCommandItem>, "editor">;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashCommandItem;
        }) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) => {
          return slashCommands.filter((item) =>
            item.title.toLowerCase().startsWith(query.toLowerCase())
          );
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashCommand;
