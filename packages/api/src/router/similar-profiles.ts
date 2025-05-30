import type { TRPCRouterRecord } from "@trpc/server";
import { eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { profile, user } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const similarProfilesRouter = {
  getSimilarUsers: protectedProcedure
    .input(z.object({ reverse: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      // Fetch the current user's profile
      const currentUserProfile = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });

      if (!currentUserProfile?.embedding) {
        throw new Error("Current user profile or embedding not found");
      }

      // Convert embedding to number array if it's not already
      const embeddingArray = Array.isArray(currentUserProfile.embedding)
        ? currentUserProfile.embedding
        : Array.from(new Float32Array(currentUserProfile.embedding));

      // Query for similar profiles
      const similarProfiles = await ctx.db
        .select({ id: profile.userId, name: user.name })
        .from(profile)
        .where(ne(profile.userId, ctx.session.user.id))
        .orderBy(
          input.reverse
            ? sql`DISTANCE(TO_VECTOR(${JSON.stringify(embeddingArray)}), ${profile.embedding}, 'L2_SQUARED') DESC`
            : sql`DISTANCE(TO_VECTOR(${JSON.stringify(embeddingArray)}), ${profile.embedding}, 'L2_SQUARED')`,
        )
        .leftJoin(user, eq(profile.userId, user.id))
        .limit(8);

      return similarProfiles.map((profile) => ({
        id: profile.id,
        name: profile.name ?? "Unknown",
      }));
    }),
} satisfies TRPCRouterRecord;
