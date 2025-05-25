"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { match } from "ts-pattern";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import type { AMessage } from "@acme/validators/message";
import { UpgradeModal } from "@acme/ui";
import { ResizablePanel, ResizablePanelGroup } from "@acme/ui/resizable";
import { toast } from "@acme/ui/toast";

import { ChatInput } from "~/components/chat-input";
import { ChatMessage } from "~/components/chat-message";
import { useAppContext } from "~/context/app-context";
import { MainChatProvider } from "~/context/main-chat-context";
import { useSearchLimits } from "~/hooks/use-search-limits";
import { useSubscription } from "~/hooks/use-subscription";
import { createUserMessage, useUpdateChat } from "~/hooks/useUpdateChat";
import { useTRPC } from "~/trpc/react";

interface MainChatProps {
  messages: AMessage[];
  chatId: string | (() => Promise<string> | string);
  messageReplacement?: React.ReactNode;
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

const MainChat = ({ messages, chatId, messageReplacement }: MainChatProps) => {
  const { isChatLoading, setIsChatLoading } = useAppContext();
  const { currentPlan } = useSubscription();
  const {
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    handleUpgrade,
    checkLimitsBeforeSearch,
  } = useSearchLimits();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { updateChat } = useUpdateChat();

  const { mutate } = useMutation(
    trpc.main.chat.mutationOptions({
      onMutate: ({ input, chatId }) => {
        const userMessage = createUserMessage(input, chatId);

        queryClient.setQueryData(trpc.chat.get.queryKey(chatId), (old) => {
          if (!old) return [userMessage];

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
              setIsChatLoading(false);
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

        // Invalidate search usage to update the indicator
        void queryClient.invalidateQueries({
          queryKey: trpc.main.getSearchUsage.queryKey(),
        });
      },

      onError: (error) => {
        setIsChatLoading(false);

        // Show specific error message for rate limiting
        if (error.data?.code === "TOO_MANY_REQUESTS") {
          toast.error(error.message);
        } else {
          toast.error("Failed to send message. Please try again.");
        }
      },
    }),
  );

  const onSubmit = async (message: string) => {
    if (!checkLimitsBeforeSearch()) {
      return;
    }

    setIsChatLoading(true);
    const stringChatId = typeof chatId === "string" ? chatId : await chatId();

    mutate({ chatId: stringChatId, input: message });
  };

  return (
    <MainChatProvider sendMessage={onSubmit}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>
          <StickToBottom
            className="flex h-screen flex-col"
            resize="smooth"
            initial="smooth"
          >
            <StickToBottom.Content className="mx-auto flex h-full max-w-[655px] flex-col gap-6 p-4 pb-12">
              {messageReplacement
                ? messageReplacement
                : messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
              {isChatLoading && (
                <Loader2 className="mt-2 h-4 w-4 animate-spin" />
              )}
            </StickToBottom.Content>

            <ScrollToBottom />
            <ChatInput
              className="mx-auto mt-auto max-w-[655px] p-4"
              onSubmit={onSubmit}
              isLoading={isChatLoading}
            />
          </StickToBottom>
        </ResizablePanel>
        {/* <ResizableHandle /> */}
        {/* <ResizablePanel defaultSize={30}></ResizablePanel> */}
      </ResizablePanelGroup>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleUpgrade}
        currentMembership={currentPlan}
      />
    </MainChatProvider>
  );
};

export default MainChat;
