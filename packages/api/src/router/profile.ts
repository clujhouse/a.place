import type { TRPCRouterRecord } from "@trpc/server";
import type { InferSelectModel } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { chat, profile } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const profileRouter = {
  get: protectedProcedure.query(
    async ({ ctx }): Promise<InferSelectModel<typeof profile> | null> => {
      const userProfile = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });

      return userProfile ?? null;
    },
  ),

  updateProfileImage: protectedProcedure
    .input(z.string().url())
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(profile)
        .set({ profileImage: input })
        .where(eq(profile.userId, ctx.session.user.id));

      return { success: true };
    }),

  updateAdditionalImages: protectedProcedure
    .input(
      z.array(z.string().url()).max(3, "You can only upload up to 3 images"),
    )
    .mutation(async ({ ctx, input }) => {
      // For MySQL, we need to fetch first
      const currentProfile = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });

      const currentImages = currentProfile?.images ?? [];
      const newImages = [...currentImages, ...input].slice(0, 3);

      await ctx.db
        .update(profile)
        .set({ images: newImages })
        .where(eq(profile.userId, ctx.session.user.id));

      return { success: true };
    }),

  updateAdditionalImageAtIndex: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        index: z.number().min(0).max(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentProfile = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });

      if (!currentProfile?.images) {
        throw new Error("No images found");
      }

      if (input.index >= currentProfile.images.length) {
        throw new Error("Invalid image index");
      }

      const newImages = [...currentProfile.images];
      newImages[input.index] = input.imageUrl;

      await ctx.db
        .update(profile)
        .set({ images: newImages })
        .where(eq(profile.userId, ctx.session.user.id));

      return { success: true };
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
