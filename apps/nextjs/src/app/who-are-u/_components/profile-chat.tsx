"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import type { AMessage } from "@acme/validators/message";
import { Button } from "@acme/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@acme/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@acme/ui/resizable";

import { ChatInput } from "~/components/chat-input";
import { ChatMessage } from "~/components/chat-message";
import { useAppContext } from "~/context/app-context";
import { useUpdateChat } from "~/hooks/useUpdateChat";
import { useTRPC } from "~/trpc/react";
import { ProfileBio } from "./profile-bio";
import { useProfileConfetti } from "./profile-confetti";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { updateChat } = useUpdateChat();

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateProfileBio = (newProfile: string) => {
    queryClient.setQueryData(trpc.profile.get.queryKey(), (old) => {
      if (!old)
        return {
          completionPercentage: 0,
          text: newProfile,
          shortBio: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
          embedding: null,
          isOnboarded: false,
          profileImage: null,
          images: [],
        };

      return { ...old, text: newProfile };
    });
  };

  const updateProfileCompletion = (completionPercentage: number) => {
    queryClient.setQueryData(trpc.profile.get.queryKey(), (old) => {
      if (!old) return null;

      return { ...old, completionPercentage };
    });
  };
  const { setShowConfetti } = useProfileConfetti();

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
            .with({ type: "completionPercentage" }, (completionPercentage) => {
              updateProfileCompletion(completionPercentage.validation);
            })
            .with({ type: "confetti" }, () => {
              setShowConfetti(true);
            })
            .exhaustive();
      },

      onError: () => {
        setIsProfileCreating(false);
      },
    }),
  );

  const isInitialMessage = useRef(true);
  useEffect(() => {
    if (messages.length === 0 && isInitialMessage.current) {
      isInitialMessage.current = false;
      mutate({
        chatId,
        input:
          "yo i'm new here, really trying to get the vibe, what's this????",
      });
    }
  }, []);

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>
            <StickToBottom
              className="flex h-screen flex-col"
              resize="smooth"
              initial="smooth"
            >
              <StickToBottom.Content className="mx-auto flex max-w-xl flex-col gap-6 p-4 pb-12">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </StickToBottom.Content>

              <ScrollToBottom />

              <ChatInput
                className="mx-auto mt-auto max-w-xl p-4"
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
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-lg font-semibold">Who Are You?</h1>
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="mr-2 h-4 w-4" />
                Your Profile
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Your Profile</DrawerTitle>
              </DrawerHeader>
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <ProfileBio />
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Chat Messages */}
        <div className="pb-24">
          <div className="mx-auto max-w-xl space-y-6 p-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {/* Invisible div to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Input at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <ChatInput
            className="mx-auto max-w-xl p-4"
            onSubmit={(message) => mutate({ chatId, input: message })}
            isLoading={isProfileCreating}
          />
        </div>
      </div>
    </>
  );
};

export default ProfileChat;
