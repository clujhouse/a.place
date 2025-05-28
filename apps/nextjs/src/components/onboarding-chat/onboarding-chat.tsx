"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui";
import { ThemeToggle } from "@acme/ui/theme";

import { ChatInput } from "~/components/chat-input";
import { ChatMessage } from "~/components/chat-message";
import { useStreamingMessages } from "~/hooks/use-streaming-messages";
import { useTRPC } from "~/trpc/react";
import { OnboardingStepper } from "./onboarding-stepper";
import { ProfileImageUpload } from "./profile-image-upload";

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

export const OnboardingChat = ({ open }: { open: boolean }) => {
  const [isOpen, setIsOpen] = useState(open);
  const [currentStep, setCurrentStep] = useState("");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { messages, isLoading, setIsLoading, addUserMessage, processStream } =
    useStreamingMessages({
      onStep: (step) => setCurrentStep(step),
      onExtracted: (data) => console.log("Extracted data:", data),
    });

  // Get onboarding state
  const { data: onboardingState } = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    enabled: isOpen,
  });

  // Get profile to check if user is onboarded
  const { data: profile } = useQuery({
    ...trpc.profile.get.queryOptions(),
  });

  const getInitialMessage = useMutation(
    trpc.onboarding.getInitialMessage.mutationOptions({
      onMutate: () => {
        setIsLoading(true);
      },
      onSuccess: async (data) => {
        await processStream(data);

        // Invalidate the state query to get updated data
        await queryClient.invalidateQueries({
          queryKey: trpc.onboarding.getState.queryKey(),
        });
      },
      onError: () => {
        setIsLoading(false);
      },
    }),
  );

  // Auto-open dialog if user is not onboarded
  useEffect(() => {
    if (profile && !profile.isOnboarded && !isOpen) {
      setIsOpen(true);
    }
  }, [profile, isOpen]);

  const { mutate } = useMutation(
    trpc.onboarding.chat.mutationOptions({
      onMutate: ({ input }) => {
        setIsLoading(true);
        addUserMessage(input);
      },
      onSuccess: async (data) => {
        const messageState = await processStream(data);

        // Invalidate the state query to get updated data
        await queryClient.invalidateQueries({
          queryKey: trpc.onboarding.getState.queryKey(),
        });

        // Invalidate profile query to check if onboarding is complete
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.get.queryKey(),
        });

        // Close dialog if onboarding is complete
        if (currentStep === "complete") {
          setIsOpen(false);
        }
      },
      onError: () => {
        setIsLoading(false);
      },
    }),
  );

  // Send initial message when dialog opens for the first time
  const refInitialMessage = useRef(false);
  useEffect(() => {
    if (
      isOpen &&
      messages.length === 0 &&
      !onboardingState &&
      !refInitialMessage.current
    ) {
      getInitialMessage.mutate();
      refInitialMessage.current = true;
    }
  }, [isOpen, messages.length, onboardingState]);

  // Handle moving to next step after image upload
  const handleImageStepComplete = () => {
    mutate({
      input: "I've uploaded my profile picture",
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.parts
          .filter((part) => part.type === "text")
          .map((part) => (part as any).text)
          .join(""),
      })),
    });
  };

  return (
    <Dialog open={isOpen}>
      <DialogTrigger asChild>
        <Button>Get Started</Button>
      </DialogTrigger>
      <DialogContent className="flex h-screen !max-h-none w-screen max-w-none flex-col overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle> a.place</DialogTitle>
        </DialogHeader>
        <ThemeToggle />

        {/* Onboarding Stepper */}
        <OnboardingStepper currentStep={currentStep} />

        <StickToBottom
          className="flex h-full min-h-0 w-full flex-col"
          resize="smooth"
          initial="smooth"
        >
          <StickToBottom.Content className="mx-auto max-w-xl flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {/* Show profile image upload component when we reach the image step */}
              {currentStep === "image" && (
                <div className="mt-6">
                  <ProfileImageUpload
                    onImageUploaded={handleImageStepComplete}
                  />
                </div>
              )}
            </div>
          </StickToBottom.Content>

          <ScrollToBottom />

          {/* Hide chat input when showing image upload */}
          {currentStep !== "image" && (
            <ChatInput
              className="mx-auto max-w-xl"
              onSubmit={(message) =>
                mutate({
                  input: message,
                  messages: messages.map((msg) => ({
                    role: msg.role,
                    content: msg.parts
                      .filter((part) => part.type === "text")
                      .map((part) => (part as any).text)
                      .join(""),
                  })),
                })
              }
              isLoading={isLoading}
              placeholder="Type your message..."
            />
          )}
        </StickToBottom>
      </DialogContent>
    </Dialog>
  );
};
