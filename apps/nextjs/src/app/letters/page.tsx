"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Mail } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { useTRPC } from "~/trpc/react";
import { ConversationView } from "./_components/conversation-view";

export default function LettersPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null,
  );

  const { data: conversations, isLoading } = useQuery({
    ...trpc.conversation.getConversations.queryOptions(),
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  const handleConversationClick = (partnerId: string) => {
    // On mobile, navigate to separate page
    // On desktop, select conversation for split view
    if (window.innerWidth < 768) {
      router.push(`/letters/${partnerId}`);
    } else {
      setSelectedPartnerId(partnerId);
    }
  };

  const selectedConversation = conversations?.find(
    (conv) => conv.partnerId === selectedPartnerId,
  );

  if (isLoading) {
    return (
      <div className="bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <div className="flex h-14 items-center px-4">
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              Letters
            </h1>
          </div>
        </div>

        {/* Mobile Loading */}
        <div className="space-y-1 p-4 md:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Layout */}
        <div className="hidden h-screen md:flex">
          {/* Left Sidebar */}
          <div className="w-80 border-r">
            <div className="border-b p-4">
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                Letters
              </h1>
            </div>
            <div className="space-y-1 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {/* Right Content */}
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Loading conversations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <div className="flex h-14 items-center px-4">
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              Letters
            </h1>
          </div>
        </div>

        {/* Mobile Empty State */}
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 md:hidden">
          <div className="space-y-4 text-center">
            <Mail className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No letters yet</h2>
            <p className="text-muted-foreground">
              Start a conversation by sending a letter to someone from their
              profile.
            </p>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden h-screen md:flex">
          {/* Left Sidebar */}
          <div className="w-80 border-r">
            <div className="border-b p-4">
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                Letters
              </h1>
            </div>
            <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4">
              <div className="space-y-4 text-center">
                <Mail className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">No letters yet</h2>
                <p className="text-muted-foreground">
                  Start a conversation by sending a letter to someone from their
                  profile.
                </p>
              </div>
            </div>
          </div>
          {/* Right Content */}
          <div className="flex flex-1 items-center justify-center">
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-semibold">Select a conversation</h2>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start reading letters.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              Letters
            </h1>
          </div>
        </div>

        {/* Conversations List */}
        <div className="divide-y">
          {conversations.map((conversation) => (
            <Card
              key={conversation.partnerId}
              className="cursor-pointer border-0 shadow-none transition-colors hover:bg-accent active:bg-accent/80"
              onClick={() => handleConversationClick(conversation.partnerId)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={conversation.partnerImage || ""}
                    alt={conversation.partnerName}
                  />
                  <AvatarFallback>
                    {conversation.partnerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-base font-semibold">
                      {conversation.partnerName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(conversation.lastMessage.createdAt),
                          { addSuffix: true },
                        )}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-5 min-w-5 text-xs"
                        >
                          {conversation.unreadCount > 99
                            ? "99+"
                            : conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {conversation.lastMessage.text}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Desktop Split Layout */}
      <div className="hidden h-screen md:flex">
        {/* Left Sidebar - Conversations List */}
        <div className="w-80 border-r">
          <div className="border-b p-4">
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              Letters
            </h1>
          </div>
          <div className="divide-y">
            {conversations.map((conversation) => (
              <Card
                key={conversation.partnerId}
                className={`cursor-pointer border-0 shadow-none transition-colors hover:bg-accent ${
                  selectedPartnerId === conversation.partnerId
                    ? "bg-accent"
                    : ""
                }`}
                onClick={() => handleConversationClick(conversation.partnerId)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={conversation.partnerImage || ""}
                      alt={conversation.partnerName}
                    />
                    <AvatarFallback>
                      {conversation.partnerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-base font-semibold">
                        {conversation.partnerName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(conversation.lastMessage.createdAt),
                            { addSuffix: true },
                          )}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="h-5 min-w-5 text-xs"
                          >
                            {conversation.unreadCount > 99
                              ? "99+"
                              : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {conversation.lastMessage.text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Content - Conversation View */}
        <div className="flex-1">
          {selectedConversation ? (
            <ConversationView
              partnerId={selectedConversation.partnerId}
              partnerName={selectedConversation.partnerName}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="space-y-4 text-center">
                <h2 className="text-xl font-semibold">Select a conversation</h2>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start reading
                  letters.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
