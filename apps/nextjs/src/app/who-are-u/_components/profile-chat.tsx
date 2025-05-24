"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { useAppContext } from "~/context/app-context";

import type { AMessage } from "@acme/validators/message";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@acme/ui/resizable";

import { ChatInput } from "~/components/chat-input";
import { ChatMessage } from "~/components/chat-message";
import { useUpdateChat } from "~/hooks/useUpdateChat";
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

const ProfileChat = ({ messages, chatId }: ProfileChatProps) => {
  const { isProfileCreating, setIsProfileCreating } = useAppContext();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { updateChat } = useUpdateChat();

  const updateProfileBio = (newProfile: string) => {
    queryClient.setQueryData(trpc.profile.get.queryKey(), (old) => {
      if (!old) return null;

      return { ...old, text: newProfile };
    });
  };

  const updateProfileCompletion = (completionPercentage: number) => {
    queryClient.setQueryData(trpc.profile.get.queryKey(), (old) => {
      if (!old) return null;

      return { ...old, completionPercentage };
    });
  };

  const { mutate } = useMutation(
    trpc.llm.learnAboutYou.mutationOptions({
      onMutate: ({ input, chatId }) => {
        setIsProfileCreating(true);
        const message: AMessage = {
          role: "user",
          parts: [{ id: nanoid(), type: "text", text: input }],
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
      onSuccess: async (data) => {
        let messageId = "";
        let newProfileText = "";
        for await (const part of data)
          match(part)
            .with({ type: "learnAboutYou" }, ({ chunk }) => {
              if (chunk.type === "messageId") messageId = chunk.id;

              if (chunk.type === "text") updateChat(messageId, chunk, chatId);
            })
            .with({ type: "profile" }, ({ chunk }) => {
              setIsProfileCreating(false);
              if (chunk.type === "text-delta")
                newProfileText += chunk.textDelta;

              updateProfileBio(newProfileText);
            })
            .with({ type: "validation" }, ({ validation }) => {
              console.log("Received validation result:", validation);
              updateProfileCompletion(validation.completionPercentage);
            });
      },

      onError: () => {
        setIsProfileCreating(false);
      },
    }),
  );
  
  useEffect(() => {
    if (messages.length === 0) {
      mutate({ chatId, input: "Hello! Tell me more about this profile creation page and let's get started." });
    }
  }, [messages, mutate, chatId]);

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
            isLoading={isProfileCreating}
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
