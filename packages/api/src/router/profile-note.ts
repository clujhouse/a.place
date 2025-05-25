import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { profileNote } from "@acme/db/schema";
import { desc, eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const profileNoteRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        receivingUserId: z.string(),
        text: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { receivingUserId, text } = input;
      const postingUserId = ctx.session.user.id;

      // Create the profile note
      await ctx.db.insert(profileNote).values({
        postingUserId,
        receivingUserId,
        text,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        text: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, text } = input;
      const userId = ctx.session.user.id;

      // First check if the user is the owner of the note
      const existingNote = await ctx.db.query.profileNote.findFirst({
        where: eq(profileNote.id, id),
      });

      if (!existingNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      if (existingNote.postingUserId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own notes",
        });
      }

      // Update the note
      await ctx.db
        .update(profileNote)
        .set({ text })
        .where(eq(profileNote.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user.id;

      // First check if the user is the owner of the note
      const existingNote = await ctx.db.query.profileNote.findFirst({
        where: eq(profileNote.id, id),
      });

      if (!existingNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      if (existingNote.postingUserId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own notes",
        });
      }

      // Delete the note
      await ctx.db.delete(profileNote).where(eq(profileNote.id, id));

      return { success: true };
    }),

  getByReceivingUserId: protectedProcedure
    .input(
      z.object({
        receivingUserId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { receivingUserId } = input;

      const notes = await ctx.db.query.profileNote.findMany({
        where: eq(profileNote.receivingUserId, receivingUserId),
        orderBy: [desc(profileNote.createdAt)],
      });

      return notes;
    }),

  getByPostingUserId: protectedProcedure
    .input(
      z.object({
        postingUserId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { postingUserId } = input;

      const notes = await ctx.db.query.profileNote.findMany({
        where: eq(profileNote.postingUserId, postingUserId),
        orderBy: [desc(profileNote.createdAt)],
      });

      return notes;
    }),
}); 