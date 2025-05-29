"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, Loader2 } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { usePostHog } from "posthog-js/react";
import { match } from "ts-pattern";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import type { AMessage } from "@acme/validators/message";
import { authClient } from "@acme/auth/client";
import { Button, UpgradeModal } from "@acme/ui";
import { Icon } from "@acme/ui/icon";
import { toast } from "@acme/ui/toast";

import { ChatInput } from "~/components/chat-input";
import { ChatMessage } from "~/components/chat-message";
import { useAppContext } from "~/context/app-context";
import { useSearchLimits } from "~/hooks/use-search-limits";
import { useSubscription } from "~/hooks/use-subscription";
import { createUserMessage, useUpdateChat } from "~/hooks/useUpdateChat";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

interface MainChatProps {
  messages: AMessage[];
  chatId?: string;
  onSubmit?: (message: string) => void;
  isHomepage?: boolean;
}

function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  return (
    !isAtBottom && (
      <Button
        className="absolute bottom-0 right-0 translate-x-[-50%] rounded-lg text-4xl"
        onClick={() => scrollToBottom()}
      >
        <Icon as={ArrowDown} />
      </Button>
    )
  );
}

const MainChat = ({
  messages,
  chatId,
  isHomepage,
  onSubmit: _onSubmit,
}: MainChatProps) => {
  const [query, setQuery] = useQueryState("query", parseAsString);
  const router = useRouter();
  const posthog = usePostHog();

  const initialQueryRefRun = useRef<boolean>(false);

  const { isChatLoading, setIsChatLoading } = useAppContext();
  const { currentPlan } = useSubscription();
  const {
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    handleUpgrade,
    checkLimitsBeforeSearch,
  } = useSearchLimits();
  const { data: session } = authClient.useSession();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { updateChat } = useUpdateChat();

  const { mutate } = useMutation(
    trpc.main.chat.mutationOptions({
      onMutate: ({ input, chatId }) => {
        const userMessage = createUserMessage(input, chatId);

        // Track search attempt
        posthog.capture("search_attempted", {
          query: input,
          query_length: input.length,
          query_word_count: input.split(/\s+/).length,
          chat_id: chatId,
          is_homepage: isHomepage,
          source: "main_chat",
        });

        queryClient.setQueryData(trpc.chat.get.queryKey(chatId), (old) => {
          if (!old) return [userMessage];

          return [...old, userMessage];
        });
      },
      onSuccess: async (data, vars) => {
        let messageId: string | null = null;
        let profilesFound = 0;
        let aiResponseLength = 0;

        for await (const part of data)
          match(part)
            .with({ type: "messageId" }, (data) => {
              messageId = data.id;
            })
            .with({ type: "text" }, (part) => {
              setIsChatLoading(false);
              aiResponseLength += part.text.length;
              if (messageId) updateChat(messageId, part, vars.chatId);
            })
            .with({ type: "profile" }, (part) => {
              if (messageId) {
                updateChat(messageId, part, vars.chatId);
                profilesFound = part.profiles.length;
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

        // Track successful search completion
        posthog.capture("search_completed", {
          query: vars.input,
          query_length: vars.input.length,
          query_word_count: vars.input.split(/\s+/).length,
          profiles_found: profilesFound,
          ai_response_length: aiResponseLength,
          chat_id: vars.chatId,
          is_homepage: isHomepage,
          source: "main_chat",
        });

        // Invalidate search usage to update the indicator
        void queryClient.invalidateQueries({
          queryKey: trpc.main.getSearchUsage.queryKey(),
        });
      },

      onError: (error, vars) => {
        setIsChatLoading(false);

        // Track search failure
        posthog.capture("search_failed", {
          query: vars.input,
          query_length: vars.input.length,
          query_word_count: vars.input.split(/\s+/).length,
          error_code: error.data?.code,
          error_message: error.message,
          chat_id: vars.chatId,
          is_homepage: isHomepage,
          source: "main_chat",
        });

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
    // Check if user is logged in
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (!checkLimitsBeforeSearch()) return;

    _onSubmit?.(message);
    if (chatId) {
      setIsChatLoading(true);

      mutate({ chatId, input: message });
    }
  };

  useEffect(() => {
    if (initialQueryRefRun.current) return;

    if (query && chatId) {
      initialQueryRefRun.current = true;

      // Track query parameter search
      posthog.capture("search_from_query_param", {
        query,
        query_length: query.length,
        query_word_count: query.split(/\s+/).length,
        chat_id: chatId,
        source: "query_parameter",
      });

      void onSubmit(query);
      void setQuery(null);
    }
  }, [query, mutate, chatId, setQuery, posthog]);

  return (
    <>
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleUpgrade}
        currentMembership={currentPlan}
      />
      <StickToBottom
        className={cn("flex flex-col", !isHomepage && "h-full")}
        resize="smooth"
        initial="instant"
      >
        {!isHomepage && (
          <StickToBottom.Content className="mx-auto flex max-w-[655px] flex-col gap-6 p-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isChatLoading && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
          </StickToBottom.Content>
        )}

        {/* <ScrollToBottom /> */}
        <ChatInput
          className="mx-auto mt-auto max-w-[655px] p-4"
          onSubmit={onSubmit}
          isLoading={isChatLoading}
        />
      </StickToBottom>
    </>
  );
};

export default MainChat;
