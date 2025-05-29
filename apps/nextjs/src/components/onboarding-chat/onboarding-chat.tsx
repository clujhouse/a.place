"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
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
import ClujhouseIcon from "~/components/clujhouse-icon";
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
  const [isProfileGenerating, setIsProfileGenerating] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  const { messages, isLoading, setIsLoading, addUserMessage, processStream } =
    useStreamingMessages({
      onStep: (step) => {
        const previousStep = currentStep;
        setCurrentStep(step);

        // Track onboarding step progression
        if (step !== previousStep) {
          posthog.capture("onboarding_step_reached", {
            step: step,
            previous_step: previousStep,
            total_messages: messages.length,
            time_in_previous_step: Date.now(), // You could track actual time if needed
          });
        }
      },
      onExtracted: (data) => {
        console.log("Extracted data:", data);
        // Track data extraction
        posthog.capture("onboarding_data_extracted", {
          extracted_name: data.name,
          extracted_location: data.location,
          extracted_story: data.story ? "present" : "not_present",
          current_step: currentStep,
        });
      },
      onProfileGenerating: (status) => {
        setIsProfileGenerating(status === "generating");
        if (status === "generating") {
          posthog.capture("onboarding_profile_generation_started", {
            final_step: currentStep,
            total_messages: messages.length,
          });
        } else if (status === "complete") {
          posthog.capture("onboarding_completed", {
            total_messages: messages.length,
            completion_time: Date.now(), // You could track actual duration
          });
          // Close dialog after a short delay to show completion
          setTimeout(() => setIsOpen(false), 1000);
        }
      },
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
      // Track onboarding start
      posthog.capture("onboarding_started", {
        trigger: "auto_open",
        user_has_profile: !!profile,
      });
    }
  }, [profile, isOpen, posthog]);

  const { mutate } = useMutation(
    trpc.onboarding.chat.mutationOptions({
      onMutate: ({ input }) => {
        setIsLoading(true);
        addUserMessage(input);

        // Track user message in onboarding
        posthog.capture("onboarding_user_message", {
          current_step: currentStep,
          message_length: input.length,
          message_number: messages.length + 1,
        });
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
        posthog.capture("onboarding_error", {
          current_step: currentStep,
          error_type: "chat_mutation_failed",
        });
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
    posthog.capture("onboarding_image_uploaded", {
      current_step: currentStep,
      total_messages: messages.length,
    });

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
              {/* {currentStep === "image" && ( */}
              <div className="mt-6">
                <ProfileImageUpload onImageUploaded={handleImageStepComplete} />
              </div>
              {/* )} */}
            </div>

            {/* Show clubhouse loader when generating profile - positioned absolutely */}
            {isProfileGenerating && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4">
                  <ClujhouseIcon />
                  <div className="text-center">
                    <p className="text-lg font-medium">
                      creating your profile...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      going on the moon with a blue hair cat
                    </p>
                  </div>
                </div>
              </div>
            )}
          </StickToBottom.Content>

          <ScrollToBottom />

          {/* Hide chat input when showing image upload or generating profile */}
          {currentStep !== "image" && !isProfileGenerating && (
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
