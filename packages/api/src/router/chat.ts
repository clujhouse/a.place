import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { chat } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const chatRouter = {
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.chat.findMany({
      where: (chat, { eq }) => eq(chat.userId, ctx.session.user.id),
      orderBy: (chat, { desc }) => [desc(chat.createdAt)],
    });
  }),

  get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const chat = await ctx.db.query.chat.findFirst({
      where: (chat, { eq }) => eq(chat.id, input),
      with: {
        messages: true,
      },
    });

    return (chat?.messages ?? []) as AMessage[];
  }),

  create: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const newChat = await ctx.db.query.chat.findFirst({
      where: (chat, { eq }) => eq(chat.id, input),
    });

    if (!newChat) {
      await ctx.db.insert(chat).values({
        id: input,
        title: "Profile Chat",
        userId: ctx.session.user.id,
      });

      return input;
    }
    return input;
  }),
} satisfies TRPCRouterRecord;
