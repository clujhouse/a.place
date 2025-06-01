import type { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { house } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const houseRouter = {
  getAll: publicProcedure.query(async ({ ctx }) => {
    const houses = await ctx.db.query.house.findMany({
      orderBy: (house, { desc }) => [desc(house.createdAt)],
      with: {
        cohorts: true,
      },
    });
    return houses;
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const houseData = await ctx.db.query.house.findFirst({
      where: eq(house.id, input),
    });
    return houseData;
  }),

  getBySlug: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const houseData = await ctx.db.query.house.findFirst({
      where: eq(house.slug, input),
      with: {
        owner: true,
        cohorts: {
          with: {
            members: {
              with: {
                user: true,
              },
            },
          },
          orderBy: (cohort, { desc }) => [desc(cohort.createdAt)],
        },
      },
    });
    return houseData;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().min(1),
        locationName: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        color: z.string(),
        logoUrl: z.string(),
        coverUrl: z.string(),
        images: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newHouse = await ctx.db
        .insert(house)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description,
          locationName: input.locationName ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          color: input.color,
          logoUrl: input.logoUrl,
          coverUrl: input.coverUrl,
          images: input.images,
          ownerId: ctx.session.user.id,
        })
        .$returningId();

      return { success: true, houseId: newHouse[0]?.id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        locationName: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        color: z.string().optional(),
        logoUrl: z.string().optional(),
        coverUrl: z.string().optional(),
        images: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      await ctx.db.update(house).set(updateData).where(eq(house.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(house).where(eq(house.id, input));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
