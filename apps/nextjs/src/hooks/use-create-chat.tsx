import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";

import { useTRPC } from "~/trpc/react";

export const useCreateChat = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createChatMutation = useMutation({
    ...trpc.chat.create.mutationOptions({
      onMutate: (newChatId: string) => {
        const previousChats = queryClient.getQueryData(
          trpc.chat.getAll.queryKey(),
        );
        queryClient.setQueryData(trpc.chat.getAll.queryKey(), (old) => {
          if (!old) return old;

          const newChat = {
            id: newChatId,
            createdAt: new Date(),
            title: "New Chat",
            userId: "1",
            visibility: "public",
            // Add other expected chat properties here
          } as RouterOutputs["chat"]["getAll"][number];

          return [newChat, ...old];
        });

        // Return a context object with the snapshotted value
        return { previousChats };
      },
      onError: (err, newChatId, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        queryClient.setQueryData(
          trpc.chat.getAll.queryKey(),
          context?.previousChats,
        );
      },
    }),
  });

  return {
    createChat: createChatMutation.mutateAsync,
    isCreating: createChatMutation.isPending,
    createdChat: createChatMutation.data,
    error: createChatMutation.error,
  };
};
