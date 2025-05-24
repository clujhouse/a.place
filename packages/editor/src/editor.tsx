"use client";

import type { EditorInstance, JSONContent } from "novel";
import { EditorContent, EditorRoot } from "novel";

import { cn } from "@acme/ui";

import { defaultExtensions } from "./extensions";
import { proseTw } from "./styles";

const extensions = [...defaultExtensions];

interface TailwindAdvancedEditorProps {
  className?: string;

  defaultContent?: JSONContent;
  onContentChange: (editor: EditorInstance) => void;
}

const TailwindAdvancedEditor = ({
  className,
  onContentChange,
  defaultContent,
}: TailwindAdvancedEditorProps) => {
  return (
    <EditorRoot>
      <EditorContent
        initialContent={defaultContent ?? undefined}
        extensions={extensions}
        className={className}
        editorProps={{
          attributes: {
            class: cn(proseTw, `sm:pb-[calc(10vh)]`),
          },
        }}
        onUpdate={({ editor }) => {
          onContentChange(editor);
        }}
        //   slotAfter={<ImageResizer />}
      >
        {/* <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand> */}

        {/* <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />

            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <MathSelector />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
          </GenerativeMenuSwitch> */}
      </EditorContent>
    </EditorRoot>
  );
};

export { TailwindAdvancedEditor };
