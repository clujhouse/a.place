"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { ScrollArea } from "@acme/ui/scroll-area";
import { toast } from "@acme/ui/toast";

import { ProfileSidebar } from "~/components/profile-sidebar";
import { useTRPC } from "~/trpc/react";

interface ConversationViewProps {
  partnerId: string;
  partnerName: string;
}

export function ConversationView({
  partnerId,
  partnerName,
}: ConversationViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    ...trpc.conversation.getMessagesWithUser.queryOptions(partnerId),
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  const { data: partnerProfile } = useQuery(
    trpc.profile.getById.queryOptions(partnerId),
  );

  const { mutate: sendMessage, isPending } = useMutation(
    trpc.conversation.sendMessage.mutationOptions({
      onSuccess: () => {
        setNewMessage("");
        // Invalidate both the messages and conversations queries
        void queryClient.invalidateQueries({
          queryKey: trpc.conversation.getMessagesWithUser.queryKey(partnerId),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.conversation.getConversations.queryKey(),
        });
      },
      onError: () => {
        toast.error("Failed to send letter");
      },
    }),
  );

  // Scroll to bottom when messages change or component mounts
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Reset scroll flag when switching conversations
  useEffect(() => {
    setHasInitiallyScrolled(false);
    previousMessageCount.current = 0;
  }, [partnerId]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const currentMessageCount = messages.length;
      const hasNewMessages = currentMessageCount > previousMessageCount.current;

      if (!hasInitiallyScrolled) {
        // Initial load - always scroll to bottom
        setTimeout(scrollToBottom, 100);
        setHasInitiallyScrolled(true);
      } else if (hasNewMessages) {
        // New messages arrived - always scroll to show them
        setTimeout(scrollToBottom, 100);
      }

      previousMessageCount.current = currentMessageCount;
    }
  }, [messages, hasInitiallyScrolled]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessage({
      receiverId: partnerId,
      text: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleHeaderClick = () => {
    setProfileOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header - Hidden on mobile, shown on desktop */}
        <div
          className="hidden cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-accent md:flex"
          onClick={handleHeaderClick}
        >
          <Avatar className="h-10 w-10">
            {partnerProfile?.user.image ? (
              <AvatarImage src={partnerProfile.user.image} alt={partnerName} />
            ) : (
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="font-semibold">{partnerName}</h2>
            <p className="text-sm text-muted-foreground">
              {messages?.length || 0} letters
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages?.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === partnerId
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === partnerId
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`mt-1 text-xs ${
                      message.senderId === partnerId
                        ? "text-muted-foreground"
                        : "text-primary-foreground/70"
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
            {messages?.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <p>No letters yet. Start the conversation!</p>
              </div>
            )}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder={`Letter to ${partnerName}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isPending}
              maxLength={1000}
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {newMessage.length}/1000 characters
          </p>
        </div>
      </div>

      {/* Profile Sidebar */}
      <ProfileSidebar
        profileId={partnerId}
        profileName={partnerName}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </>
  );
}
