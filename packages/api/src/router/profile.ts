import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { chat } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const profileRouter = {
  get: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.profile.findFirst({
      where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
    });

    return profile ?? null;
  }),

  chat: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return (await ctx.db.query.message.findMany({
      where: (message, { eq }) => eq(message.chatId, input),
      orderBy: (message, { asc }) => asc(message.createdAt),
    })) as AMessage[];
  }),

  getProfileChat: protectedProcedure.query(async ({ ctx }) => {
    const profileChat = await ctx.db.query.chat.findFirst({
      where: (chat, { eq }) => eq(chat.userId, ctx.session.user.id),
    });

    if (!profileChat) {
      const data = await ctx.db
        .insert(chat)
        .values({
          title: "Profile Chat",
          userId: ctx.session.user.id,
        })
        .$returningId();

      return data[0];
    }
    return profileChat;
  }),
} satisfies TRPCRouterRecord;
