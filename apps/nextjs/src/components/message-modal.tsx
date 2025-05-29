"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react";
import { usePostHog } from "posthog-js/react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface MessageModalProps {
  receiverId: string;
  receiverName: string;
  trigger?: React.ReactNode;
  onMessageSent?: () => void;
}

export function MessageModal({
  receiverId,
  receiverName,
  trigger,
  onMessageSent,
}: MessageModalProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  const { mutate: sendMessage, isPending } = useMutation(
    trpc.conversation.sendMessage.mutationOptions({
      onSuccess: () => {
        toast.success("Letter sent successfully!");

        // Track successful message send
        posthog.capture("letter_sent", {
          receiver_id: receiverId,
          receiver_name: receiverName,
          message_length: message.trim().length,
          message_word_count: message.trim().split(/\s+/).length,
          source: "message_modal",
        });

        setMessage("");
        setOpen(false);
        // Invalidate conversations to update the list
        void queryClient.invalidateQueries({
          queryKey: trpc.conversation.getConversations.queryKey(),
        });
        // Call the callback if provided
        onMessageSent?.();
      },
      onError: () => {
        toast.error("Failed to send letter");

        // Track failed message send
        posthog.capture("letter_send_failed", {
          receiver_id: receiverId,
          receiver_name: receiverName,
          message_length: message.trim().length,
          error_type: "api_error",
          source: "message_modal",
        });
      },
    }),
  );

  const handleOpenModal = () => {
    setOpen(true);

    // Track message modal opened
    posthog.capture("letter_modal_opened", {
      receiver_id: receiverId,
      receiver_name: receiverName,
      source: "message_modal",
    });
  };

  const handleSend = () => {
    if (!message.trim()) return;

    posthog.capture("letter_send_attempted", {
      receiver_id: receiverId,
      receiver_name: receiverName,
      message_length: message.trim().length,
      message_word_count: message.trim().split(/\s+/).length,
      source: "message_modal",
    });

    sendMessage({
      receiverId,
      text: message.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={handleOpenModal}>
        {trigger || (
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send Letter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md sm:mx-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Send Letter</DialogTitle>
          <DialogDescription>Send a letter to {receiverName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Type your letter here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {message.length}/1000
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isPending}
                className="flex-1 sm:flex-none"
              >
                <Send className="mr-2 h-4 w-4" />
                {isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
