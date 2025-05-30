import type { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { application, cohort, cohortMember } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const cohortRouter = {
  getAll: publicProcedure.query(async ({ ctx }) => {
    const cohorts = await ctx.db.query.cohort.findMany({
      orderBy: (cohort, { desc }) => [desc(cohort.createdAt)],
      with: {
        house: true,
      },
    });
    return cohorts;
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const cohortData = await ctx.db.query.cohort.findFirst({
      where: eq(cohort.id, input),
      with: {
        house: true,
        members: {
          with: {
            user: true,
          },
        },
        applications: {
          with: {
            user: true,
          },
        },
      },
    });
    return cohortData;
  }),

  getByHouseId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const cohorts = await ctx.db.query.cohort.findMany({
        where: eq(cohort.houseId, input),
        orderBy: (cohort, { desc }) => [desc(cohort.createdAt)],
        with: {
          house: true,
        },
      });
      return cohorts;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        houseId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        status: z.enum(["active", "in progress", "archived"]).default("active"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newCohort = await ctx.db
        .insert(cohort)
        .values({
          name: input.name,
          description: input.description,
          houseId: input.houseId,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
        })
        .$returningId();

      return { success: true, cohortId: newCohort[0]?.id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["active", "in progress", "archived"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      await ctx.db.update(cohort).set(updateData).where(eq(cohort.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(cohort).where(eq(cohort.id, input));

      return { success: true };
    }),

  // Application operations
  submitApplication: protectedProcedure
    .input(
      z.object({
        cohortId: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        social: z.string().min(1),
        storyDescription: z.string().min(1),
        projectMetrics: z.string().min(1),
        isLocal: z.enum(["yes", "no"]),
        canAttendAllDays: z.enum(["yes", "no"]),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newApplication = await ctx.db
        .insert(application)
        .values({
          cohortId: input.cohortId,
          userId: ctx.session.user.id,
          name: input.name,
          email: input.email,
          social: input.social,
          storyDescription: input.storyDescription,
          projectMetrics: input.projectMetrics,
          isLocal: input.isLocal,
          canAttendAllDays: input.canAttendAllDays,
          image: input.image,
        })
        .$returningId();

      return { success: true, applicationId: newApplication[0]?.id };
    }),

  getApplications: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const applications = await ctx.db.query.application.findMany({
        where: eq(application.cohortId, input),
        with: {
          user: true,
        },
        orderBy: (application, { desc }) => [desc(application.createdAt)],
      });
      return applications;
    }),

  updateApplicationStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        status: z.enum(["pending", "approved", "rejected"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(application)
        .set({ status: input.status })
        .where(eq(application.id, input.applicationId));

      // If approved, also create a cohort member
      if (input.status === "approved") {
        const app = await ctx.db.query.application.findFirst({
          where: eq(application.id, input.applicationId),
        });

        if (app) {
          await ctx.db.insert(cohortMember).values({
            cohortId: app.cohortId,
            userId: app.userId,
            status: "accepted",
          });
        }
      }

      return { success: true };
    }),

  // Legacy member operations (keeping for backward compatibility)
  getMembers: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const members = await ctx.db.query.cohortMember.findMany({
        where: eq(cohortMember.cohortId, input),
        with: {
          user: true,
        },
      });
      return members;
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        cohortId: z.string(),
        userId: z.string(),
        status: z.enum(["accepted", "pending", "rejected"]).default("pending"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newMember = await ctx.db
        .insert(cohortMember)
        .values({
          cohortId: input.cohortId,
          userId: input.userId,
          status: input.status,
        })
        .$returningId();

      return { success: true, memberId: newMember[0]?.id };
    }),

  updateMemberStatus: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        status: z.enum(["accepted", "pending", "rejected"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(cohortMember)
        .set({ status: input.status })
        .where(eq(cohortMember.id, input.memberId));

      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(cohortMember).where(eq(cohortMember.id, input));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
