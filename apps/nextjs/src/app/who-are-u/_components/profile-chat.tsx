"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import type { AMessage } from "@acme/validators/message";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@acme/ui/resizable";

import { ChatInput } from "~/components/chat-input";
import { ChatMessage } from "~/components/chat-message";
import { useTRPC } from "~/trpc/react";
import { ProfileBio } from "./profile-bio";

interface ProfileChatProps {
  messages: AMessage[];
  chatId: string;
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

const ProfileChat = ({ messages, chatId }: ProfileChatProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateProfileMessage = (messageId: string, chunk: string) => {
    queryClient.setQueryData(trpc.profile.chat.queryKey(chatId), (old) => {
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

  const updateProfileBio = (newProfile: string) => {
    queryClient.setQueryData(trpc.profile.get.queryKey(), (old) => {
      if (!old) return null;

      return { ...old, text: newProfile };
    });
  };

  const { mutate } = useMutation(
    trpc.llm.learnAboutYou.mutationOptions({
      onMutate: ({ input, chatId }) => {
        const message: AMessage = {
          role: "user",
          parts: [{ type: "text", text: input }],
          id: nanoid(),
          chatId,
          attachments: [],
          createdAt: new Date(),
        };

        queryClient.setQueryData(trpc.profile.chat.queryKey(chatId), (old) => {
          if (!old) return [];

          return [...old, message];
        });
      },
      onSuccess: async (data) => {
        let messageId = "";
        let newProfileText = "";
        for await (const part of data)
          match(part)
            .with({ type: "learnAboutYou" }, ({ chunk }) => {
              if (chunk.type === "step-start") messageId = chunk.messageId;

              if (chunk.type === "text-delta")
                updateProfileMessage(messageId, chunk.textDelta);
            })
            .with({ type: "profile" }, ({ chunk }) => {
              console.log("profile", chunk);
              if (chunk.type === "text-delta")
                newProfileText += chunk.textDelta;
              updateProfileBio(newProfileText);
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
            onSubmit={(message) => mutate({ chatId, input: message })}
            isLoading={isLoading}
          />
        </StickToBottom>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={30}>
        <ProfileBio />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ProfileChat;
