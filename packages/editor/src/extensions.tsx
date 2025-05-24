import { Extension } from "@tiptap/core";
import {
  AIHighlight,
  CharacterCount,
  Color,
  CustomKeymap,
  GlobalDragHandle,
  HighlightExtension,
  HorizontalRule,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TextStyle,
  TiptapLink,
  TiptapUnderline,
  Youtube,
} from "novel";
import { Markdown } from "tiptap-markdown";

import {
  editorBlockquoteTw,
  editorBulletListTw,
  editorCodeTw,
  editorLinkTw,
  editorListItemTw,
  editorOrderedListTw,
  editorTaskItemTw,
  editorTaskListTw,
  horizontalRuleTw,
  youtubeTw,
} from "./styles";

//TODO I am using cx here to get tailwind autocomplete working, idk if someone else can write a regex to just capture the class key in objects
const aiHighlight = AIHighlight;
//You can overwrite the placeholder with your own configuration
const placeholder = Placeholder.configure({
  showOnlyCurrent: false,
  placeholder: () => {
    return "add your thoughts here, we also save the timestamp for your comment, you can use markdown here :)))";
  },
});

const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: editorLinkTw,
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: editorTaskListTw,
  },
});
const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: editorTaskItemTw,
  },
  nested: true,
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: horizontalRuleTw,
  },
});

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: editorBulletListTw,
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: editorOrderedListTw,
    },
  },
  listItem: {
    HTMLAttributes: {
      class: editorListItemTw,
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: editorBlockquoteTw,
    },
  },

  code: {
    HTMLAttributes: {
      class: editorCodeTw,
      spellcheck: "false",
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
});

const youtube = Youtube.configure({
  HTMLAttributes: {
    class: youtubeTw,
  },
  inline: false,
});

const characterCount = CharacterCount.configure();

const markdownExtension = Markdown.configure({
  html: true,
});

const DisableEnter = Extension.create({
  addKeyboardShortcuts() {
    return {
      Enter: () => true,
    };
  },
});
export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapLink,
  taskList,
  taskItem,
  horizontalRule,
  aiHighlight,
  youtube,
  characterCount,
  TiptapUnderline,
  HighlightExtension,
  TextStyle,
  Color,
  CustomKeymap,
  GlobalDragHandle,
  markdownExtension,
  DisableEnter,
];
