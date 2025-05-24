"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import type { AMessage } from "@acme/validators/message";
import { ResizablePanel, ResizablePanelGroup } from "@acme/ui/resizable";

import { ChatInput } from "~/components/chat-input";
import { ChatMessage } from "~/components/chat-message";
import { useTRPC } from "~/trpc/react";

interface MainChatProps {
  messages: AMessage[];
  chatId: string | (() => Promise<string>);
}

function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    !isAtBottom && (
      <button
        className="i-ph-arrow-circle-down-fill absolute bottom-0 left-[50%] translate-x-[-50%] rounded-lg text-4xl"
        onClick={() => scrollToBottom()}
      />
    )
  );
}

const createBotMessage = (id: string, chunk: string, chatId: string) =>
  ({
    id,
    role: "assistant",
    parts: [{ type: "text", text: chunk }],
    chatId,
    attachments: [],
    createdAt: new Date(),
  }) satisfies AMessage;

const MainChat = ({ messages, chatId }: MainChatProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMainChat = (messageId: string, chunk: string, chatId: string) => {
    queryClient.setQueryData(trpc.chat.get.queryKey(chatId), (old) => {
      if (!old) return [];

      const oldMessage = old.find((msg) => msg.id === messageId);
      if (!oldMessage)
        return [...old, createBotMessage(messageId, chunk, chatId)];

      const textPart = oldMessage.parts.find((part) => part.type === "text");
      if (!textPart) return old;

      return old.map((msg) => {
        if (msg.id === messageId)
          return {
            ...msg,
            parts: [{ type: "text", text: textPart.text + chunk }],
          } satisfies AMessage;
        return msg;
      });
    });
  };

  const { mutate } = useMutation(
    trpc.main.chat.mutationOptions({
      onMutate: ({ input, chatId }) => {
        const message: AMessage = {
          role: "user",
          parts: [{ type: "text", text: input }],
          id: nanoid(),
          chatId,
          attachments: [],
          createdAt: new Date(),
        };

        queryClient.setQueryData(trpc.chat.get.queryKey(chatId), (old) => {
          if (!old) return [];

          return [...old, message];
        });
      },
      onSuccess: async (data, vars) => {
        let messageId: string | null = null;
        for await (const part of data)
          match(part)
            .with({ type: "step-start" }, (data) => {
              messageId = data.messageId;
            })
            .with({ type: "text-delta" }, ({ textDelta }) => {
              if (messageId) updateMainChat(messageId, textDelta, vars.chatId);
            });

        setIsLoading(false);
      },

      onError: () => {
        setIsLoading(false);
      },
    }),
  );

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>
        <StickToBottom
          className="flex h-full flex-col"
          resize="smooth"
          initial="smooth"
        >
          <StickToBottom.Content className="mx-auto flex max-w-4xl flex-col gap-6 p-4 pb-12">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </StickToBottom.Content>

          <ScrollToBottom />
          <ChatInput
            className="mx-auto mt-auto max-w-4xl p-4"
            onSubmit={async (message) => {
              const stringChatId =
                typeof chatId === "string" ? chatId : await chatId();

              mutate({ chatId: stringChatId, input: message });
            }}
            isLoading={isLoading}
          />
        </StickToBottom>
      </ResizablePanel>
      {/* <ResizableHandle /> */}
      {/* <ResizablePanel defaultSize={30}></ResizablePanel> */}
    </ResizablePanelGroup>
  );
};

export default MainChat;
