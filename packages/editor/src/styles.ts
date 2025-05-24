import { cx } from "class-variance-authority";

// New style variables extracted from extensions.tsx
export const editorLinkTw = cx(
  "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
);

export const editorTaskListTw = cx("not-prose pl-2");
export const editorTaskItemTw = cx("flex gap-2 items-start my-4");

export const horizontalRuleTw = cx(
  "mt-4 mb-6 border-t border-muted-foreground",
);

export const editorBulletListTw = cx("list-disc list-outside leading-3 -mt-2");
export const editorOrderedListTw = cx(
  "list-decimal list-outside leading-3 -mt-2",
);
export const editorListItemTw = cx("leading-normal -mb-2");
export const editorBlockquoteTw = cx("border-l-4 border-primary");

export const editorCodeTw = cx(
  "rounded-md bg-muted px-1.5 py-1 font-mono font-medium",
);

export const youtubeTw = cx("rounded-lg border border-muted");
export const proseTw = cx(
  "prose prose-lg dark:prose-invert focus:outline-none",
);
