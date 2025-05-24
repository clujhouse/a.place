"use client";
"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TailwindAdvancedEditor = void 0;
var cn_1 = require("@udecode/cn");
var novel_1 = require("novel");
var extensions_1 = require("./extensions");
var extensions = __spreadArray([], extensions_1.defaultExtensions, true);
var TailwindAdvancedEditor = function (_a) {
    var className = _a.className, onContentChange = _a.onContentChange, defaultContent = _a.defaultContent;
    return (<novel_1.EditorRoot>
      <novel_1.EditorContent initialContent={defaultContent !== null && defaultContent !== void 0 ? defaultContent : undefined} extensions={extensions} className={className} editorProps={{
            attributes: {
                class: (0, cn_1.cn)("prose prose-lg dark:prose-invert focus:outline-none sm:pb-[calc(10vh)]"),
            },
        }} onUpdate={function (_a) {
            var editor = _a.editor;
            onContentChange(editor.getJSON());
        }}>
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
      </novel_1.EditorContent>
    </novel_1.EditorRoot>);
};
exports.TailwindAdvancedEditor = TailwindAdvancedEditor;
