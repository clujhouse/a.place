"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { match } from "ts-pattern";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import type { AMessage } from "@acme/validators/message";
import { ResizablePanel, ResizablePanelGroup } from "@acme/ui/resizable";

import { ChatInput } from "~/components/chat-input";
import { ChatMessage } from "~/components/chat-message";
import { createUserMessage, useUpdateChat } from "~/hooks/useUpdateChat";
import { useTRPC } from "~/trpc/react";

interface MainChatProps {
  messages: AMessage[];
  chatId: string | (() => Promise<string> | string);
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

const MainChat = ({ messages, chatId }: MainChatProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { updateChat } = useUpdateChat();

  const { mutate } = useMutation(
    trpc.main.chat.mutationOptions({
      onMutate: ({ input, chatId }) => {
        const userMessage = createUserMessage(input, chatId);

        queryClient.setQueryData(trpc.chat.get.queryKey(chatId), (old) => {
          if (!old) return [];

          return [...old, userMessage];
        });
      },
      onSuccess: async (data, vars) => {
        let messageId: string | null = null;
        for await (const part of data)
          match(part)
            .with({ type: "messageId" }, (data) => {
              messageId = data.id;
            })
            .with({ type: "text" }, (part) => {
              if (messageId) updateChat(messageId, part, vars.chatId);
            })
            .with({ type: "profile" }, (part) => {
              if (messageId) {
                updateChat(messageId, part, vars.chatId);
              }
            })
            .with({ type: "chatTitle" }, (part) => {
              // Optimistically update the chat list with the new title
              queryClient.setQueryData(
                trpc.chat.getAll.queryKey(),
                (oldChats) => {
                  if (!oldChats) return oldChats;

                  return oldChats.map((chat) =>
                    chat.id === part.chatId
                      ? { ...chat, title: part.title }
                      : chat,
                  );
                },
              );
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
          className="flex h-screen flex-col"
          resize="smooth"
          initial="smooth"
        >
          <StickToBottom.Content className="mx-auto flex max-w-3xl flex-col gap-6 p-4 pb-12">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </StickToBottom.Content>

          <ScrollToBottom />
          <ChatInput
            className="mx-auto mt-auto max-w-3xl p-4"
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
