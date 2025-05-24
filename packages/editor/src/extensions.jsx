"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultExtensions = void 0;
var class_variance_authority_1 = require("class-variance-authority");
var lowlight_1 = require("lowlight");
var novel_1 = require("novel");
var tiptap_markdown_1 = require("tiptap-markdown");
//TODO I am using cx here to get tailwind autocomplete working, idk if someone else can write a regex to just capture the class key in objects
var aiHighlight = novel_1.AIHighlight;
//You can overwrite the placeholder with your own configuration
var placeholder = novel_1.Placeholder.configure({
    showOnlyCurrent: false,
    placeholder: function () {
        return "add your thoughts here, we also save the timestamp for your comment, you can use markdown here :)))";
    },
});
var tiptapLink = novel_1.TiptapLink.configure({
    HTMLAttributes: {
        class: (0, class_variance_authority_1.cx)("text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer"),
    },
});
var tiptapImage = novel_1.TiptapImage.extend({
    addProseMirrorPlugins: function () {
        return [
            (0, novel_1.UploadImagesPlugin)({
                imageClass: (0, class_variance_authority_1.cx)("opacity-40 rounded-lg border border-stone-200"),
            }),
        ];
    },
}).configure({
    allowBase64: true,
    HTMLAttributes: {
        class: (0, class_variance_authority_1.cx)("rounded-lg border border-muted"),
    },
});
var updatedImage = novel_1.UpdatedImage.configure({
    HTMLAttributes: {
        class: (0, class_variance_authority_1.cx)("rounded-lg border border-muted"),
    },
});
var taskList = novel_1.TaskList.configure({
    HTMLAttributes: {
        class: (0, class_variance_authority_1.cx)("not-prose pl-2 "),
    },
});
var taskItem = novel_1.TaskItem.configure({
    HTMLAttributes: {
        class: (0, class_variance_authority_1.cx)("flex gap-2 items-start my-4"),
    },
    nested: true,
});
var horizontalRule = novel_1.HorizontalRule.configure({
    HTMLAttributes: {
        class: (0, class_variance_authority_1.cx)("mt-4 mb-6 border-t border-muted-foreground"),
    },
});
var starterKit = novel_1.StarterKit.configure({
    bulletList: {
        HTMLAttributes: {
            class: (0, class_variance_authority_1.cx)("list-disc list-outside leading-3 -mt-2"),
        },
    },
    orderedList: {
        HTMLAttributes: {
            class: (0, class_variance_authority_1.cx)("list-decimal list-outside leading-3 -mt-2"),
        },
    },
    listItem: {
        HTMLAttributes: {
            class: (0, class_variance_authority_1.cx)("leading-normal -mb-2"),
        },
    },
    blockquote: {
        HTMLAttributes: {
            class: (0, class_variance_authority_1.cx)("border-l-4 border-primary"),
        },
    },
    codeBlock: {
        HTMLAttributes: {
            class: (0, class_variance_authority_1.cx)("rounded-md bg-muted text-muted-foreground border p-5 font-mono font-medium"),
        },
    },
    code: {
        HTMLAttributes: {
            class: (0, class_variance_authority_1.cx)("rounded-md bg-muted  px-1.5 py-1 font-mono font-medium"),
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
var codeBlockLowlight = novel_1.CodeBlockLowlight.configure({
    // configure lowlight: common /  all / use highlightJS in case there is a need to specify certain language grammars only
    // common: covers 37 language grammars which should be good enough in most cases
    lowlight: (0, lowlight_1.createLowlight)(lowlight_1.common),
});
var youtube = novel_1.Youtube.configure({
    HTMLAttributes: {
        class: (0, class_variance_authority_1.cx)("rounded-lg border border-muted"),
    },
    inline: false,
});
var characterCount = novel_1.CharacterCount.configure();
var markdownExtension = tiptap_markdown_1.Markdown.configure({
    html: true,
});
exports.defaultExtensions = [
    starterKit,
    placeholder,
    tiptapLink,
    tiptapImage,
    updatedImage,
    taskList,
    taskItem,
    horizontalRule,
    aiHighlight,
    codeBlockLowlight,
    youtube,
    characterCount,
    novel_1.TiptapUnderline,
    markdownExtension,
    novel_1.HighlightExtension,
    novel_1.TextStyle,
    novel_1.Color,
    novel_1.CustomKeymap,
    novel_1.GlobalDragHandle,
    markdownExtension,
];
