"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Mail, MessageCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { useTRPC } from "~/trpc/react";
import { ConversationView } from "./_components/conversation-view";

export default function LettersPage() {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const trpc = useTRPC();

  const { data: conversations, isLoading } = useQuery(
    trpc.conversation.getConversations.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-1/3 space-y-4 border-r p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-32 w-64" />
        </div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Mail className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">No letters yet</h2>
          <p className="text-muted-foreground">
            Start a conversation by sending a letter to someone from their
            profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Conversations List */}
      <div className="w-1/3 overflow-y-auto border-r">
        <div className="border-b p-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <MessageCircle className="h-6 w-6" />
            Letters
          </h1>
        </div>
        <div className="space-y-2 p-4">
          {conversations.map((conversation) => (
            <Card
              key={conversation.partnerId}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedConversation === conversation.partnerId
                  ? "border-primary bg-accent"
                  : ""
              }`}
              onClick={() => setSelectedConversation(conversation.partnerId)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
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
                      <h3 className="truncate font-semibold">
                        {conversation.partnerName}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {conversation.lastMessage.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(conversation.lastMessage.createdAt),
                        {
                          addSuffix: true,
                        },
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Conversation View */}
      <div className="flex-1">
        {selectedConversation ? (
          <ConversationView
            partnerId={selectedConversation}
            partnerName={
              conversations.find((c) => c.partnerId === selectedConversation)
                ?.partnerName || "Unknown"
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-4 text-center">
              <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Select a conversation</h2>
              <p className="text-muted-foreground">
                Choose a conversation from the list to start writing letters.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
