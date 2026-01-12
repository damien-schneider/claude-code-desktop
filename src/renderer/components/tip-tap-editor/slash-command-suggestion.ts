import { computePosition, flip, shift } from "@floating-ui/dom";
import type { Editor } from "@tiptap/core";
import { posToDOMRect, ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type React from "react";

import {
  type SlashCommandItem,
  SlashCommandList,
  type SlashCommandListRef,
  slashCommands,
} from "./slash-command-list";

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () =>
      posToDOMRect(
        editor.view,
        editor.state.selection.from,
        editor.state.selection.to
      ),
  };

  computePosition(virtualElement, element, {
    placement: "bottom-start",
    strategy: "absolute",
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = "max-content";
    element.style.position = strategy;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
};

export const slashCommandSuggestion: Omit<
  SuggestionOptions<SlashCommandItem>,
  "editor"
> = {
  char: "/",
  items: ({ query }: { query: string }) => {
    return slashCommands.filter((item) =>
      item.title.toLowerCase().startsWith(query.toLowerCase())
    );
  },
  render: () => {
    let component: ReactRenderer<SlashCommandListRef> | null = null;

    return {
      onStart: (props: SuggestionProps<SlashCommandItem>) => {
        if (!props.clientRect) {
          return;
        }

        component = new ReactRenderer(SlashCommandList, {
          props: {
            items: props.items,
            command: (item: SlashCommandItem) => {
              props.command(item);
            },
          },
          editor: props.editor,
        });

        component.element.style.position = "absolute";
        document.body.appendChild(component.element);

        updatePosition(props.editor, component.element);
      },

      onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
        if (!component) {
          return;
        }

        component.updateProps({
          items: props.items,
          command: (item: SlashCommandItem) => {
            props.command(item);
          },
        });

        if (!props.clientRect) {
          return;
        }

        updatePosition(props.editor, component.element);
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === "Escape") {
          if (component) {
            component.element.remove();
            component.destroy();
            component = null;
          }
          return true;
        }

        return (
          component?.ref?.onKeyDown({
            event: props.event as unknown as React.KeyboardEvent<Element>,
          }) ?? false
        );
      },

      onExit: () => {
        if (component) {
          component.element.remove();
          component.destroy();
          component = null;
        }
      },
    };
  },
};
