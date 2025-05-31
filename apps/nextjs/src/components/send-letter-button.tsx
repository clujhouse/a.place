"use client";

import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import { authClient } from "@acme/auth/client";
import { Button } from "@acme/ui/button";

import { useLoginDialog } from "~/hooks/use-login-dialog";
import { MessageModal } from "./message-modal";

interface SendLetterButtonProps {
  receiverId: string;
  receiverName: string;
}

export function SendLetterButton({
  receiverId,
  receiverName,
}: SendLetterButtonProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { openLoginDialog } = useLoginDialog();

  const handleSendLetter = () => {
    if (!session?.user) {
      openLoginDialog();
      return;
    }
    // If authenticated, the MessageModal will handle the rest
  };

  const handleMessageSent = () => {
    // Redirect to letters page after sending message
    router.push("/letters");
  };

  // If user is authenticated, show the MessageModal
  if (session?.user) {
    return (
      <MessageModal
        receiverId={receiverId}
        receiverName={receiverName}
        onMessageSent={handleMessageSent}
        trigger={
          <Button size="lg" className="w-full sm:w-auto">
            <Mail className="mr-2" />
            Send Letter
          </Button>
        }
      />
    );
  }

  // If not authenticated, show a button that redirects to login
  return (
    <Button
      size="lg"
      className="w-full sm:w-auto"
      onClick={handleSendLetter}
      disabled={isPending}
    >
      <Mail className="mr-2" />
      Send Letter
    </Button>
  );
}
