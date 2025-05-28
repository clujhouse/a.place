"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";

import { AuthGuard } from "~/components/auth-guard";
import { useTRPC } from "~/trpc/react";
import { ConversationView } from "../_components/conversation-view";

interface ConversationPageProps {
  params: Promise<{
    partnerId: string;
  }>;
}

function ConversationPageContent({ params }: ConversationPageProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const { partnerId } = use(params);

  // Get conversations to find the partner name and image
  const { data: conversations } = useQuery({
    ...trpc.conversation.getConversations.queryOptions(),
    refetchInterval: 30000,
  });

  // Get partner profile for additional details
  const { data: partnerProfile } = useQuery(
    trpc.profile.getById.queryOptions(partnerId),
  );

  const handleBack = () => {
    router.back();
  };

  // Find the current conversation to get partner info
  const currentConversation = conversations?.find(
    (conv) => conv.partnerId === partnerId,
  );
  const partnerName = currentConversation?.partnerName || "Unknown";
  const partnerImage =
    currentConversation?.partnerImage || partnerProfile?.user.image;

  return (
    <div className="flex h-screen flex-col">
      {/* Mobile Sticky Header */}
      <div className="sticky top-0 z-10 flex h-28 items-center gap-6 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Avatar className="h-16 w-16">
          {partnerImage ? (
            <AvatarImage src={partnerImage} alt={partnerName} />
          ) : (
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">{partnerName}</h1>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1">
        <ConversationView partnerId={partnerId} partnerName={partnerName} />
      </div>
    </div>
  );
}

export default function ConversationPage({ params }: ConversationPageProps) {
  return (
    <AuthGuard>
      <ConversationPageContent params={params} />
    </AuthGuard>
  );
}
