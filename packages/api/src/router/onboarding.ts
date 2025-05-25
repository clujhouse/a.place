import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { generateObject, smoothStream, streamText } from "ai";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { onboardingState, profile, user } from "@acme/db/schema";

import { onboardingWithContext } from "../prompts/onboarding";
import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";

const extractedInfoSchema = z.object({
  name: z.string().nullable(),
  location: z.string().nullable(),
  story: z.string().nullable(),
});

export const onboardingRouter = {
  getState: protectedProcedure.query(async ({ ctx }) => {
    const state = await ctx.db.query.onboardingState.findFirst({
      where: (onboardingState, { eq }) =>
        eq(onboardingState.userId, ctx.session.user.id),
    });

    return state;
  }),

  getInitialMessage: protectedProcedure.mutation(async function* ({ ctx }) {
    // Get or create onboarding state
    let state = await ctx.db.query.onboardingState.findFirst({
      where: (onboardingState, { eq }) =>
        eq(onboardingState.userId, ctx.session.user.id),
    });

    if (!state) {
      await ctx.db.insert(onboardingState).values({
        userId: ctx.session.user.id,
        currentStep: "initial",
      });
      state = await ctx.db.query.onboardingState.findFirst({
        where: (onboardingState, { eq }) =>
          eq(onboardingState.userId, ctx.session.user.id),
      });
    }
    if (!state) throw new Error("Failed to create onboarding state");

    // Generate AI greeting based on current state
    const aiMessageId = nanoid();

    yield { type: "messageId" as const, id: aiMessageId };

    const textPartId = nanoid();
    let assistantText = "";

    // Create context about what we already know
    const contextInfo = {
      currentStep: state.currentStep,
      extractedName: state.extractedName,
      extractedLocation: state.extractedLocation,
      extractedOneLiner: state.extractedOneLiner,
    };

    const result = streamText({
      model: google("gemini-2.0-flash"),
      experimental_telemetry: { isEnabled: true },
      prompt: onboardingWithContext(state.currentStep, contextInfo),
      experimental_transform: smoothStream({
        delayInMs: 20,
        chunking: "word",
      }),
    });

    for await (const chunk of result.textStream) {
      assistantText += chunk;
      yield {
        type: "text" as const,
        id: textPartId,
        text: chunk,
      };
    }

    yield {
      type: "step" as const,
      step: state.currentStep,
    };
  }),

  chat: protectedProcedure
    .input(
      z.object({
        input: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        ),
      }),
    )
    .mutation(async function* ({ ctx, input: { input, messages } }) {
      // Get or create onboarding state
      let state = await ctx.db.query.onboardingState.findFirst({
        where: (onboardingState, { eq }) =>
          eq(onboardingState.userId, ctx.session.user.id),
      });

      if (!state) {
        await ctx.db.insert(onboardingState).values({
          userId: ctx.session.user.id,
          currentStep: "initial",
        });
        state = await ctx.db.query.onboardingState.findFirst({
          where: (onboardingState, { eq }) =>
            eq(onboardingState.userId, ctx.session.user.id),
        });
      }
      if (!state) throw new Error("Failed to create onboarding state");

      // Convert messages to AMessage format for processing
      const formattedMessages: AMessage[] = messages.map((msg) => ({
        id: nanoid(),
        role: msg.role,
        chatId: "onboarding",
        parts: [{ id: nanoid(), type: "text", text: msg.content }],
        attachments: [],
        createdAt: new Date(),
      }));

      // Add current user message
      const userMessage: AMessage = {
        id: nanoid(),
        role: "user",
        chatId: "onboarding",
        parts: [{ id: nanoid(), type: "text", text: input }],
        attachments: [],
        createdAt: new Date(),
      };
      const allMessages = [...formattedMessages, userMessage];

      // Generate AI response
      const aiMessageId = nanoid();
      yield { type: "messageId" as const, id: aiMessageId };
      const textPartId = nanoid();
      let assistantText = "";

      // Create context about what we already know
      const contextInfo = {
        currentStep: state.currentStep,
        extractedName: state.extractedName,
        extractedLocation: state.extractedLocation,
        extractedOneLiner: state.extractedOneLiner,
      };

      const result = streamText({
        model: google("gemini-2.0-flash"),
        messages: convertMessageToCoreMessage(allMessages),
        experimental_telemetry: { isEnabled: true },
        system: onboardingWithContext(state.currentStep, contextInfo),
        experimental_transform: smoothStream({
          delayInMs: 20,
          chunking: "word",
        }),
      });

      for await (const chunk of result.textStream) {
        assistantText += chunk;
        yield {
          type: "text" as const,
          id: textPartId,
          text: chunk,
        };
      }

      // Add assistant message for extraction
      const assistantMessage: AMessage = {
        id: aiMessageId,
        role: "assistant",
        chatId: "onboarding",
        parts: [{ id: textPartId, type: "text", text: assistantText }],
        attachments: [],
        createdAt: new Date(),
      };
      const updatedMessages = [...allMessages, assistantMessage];

      // Extract information from the conversation
      const extractionResult = await generateObject({
        model: google("gemini-2.0-flash"),
        schema: extractedInfoSchema,
        prompt: `Extract the following information from this conversation:\n- name: The user's name if they mentioned it\n- location: Where they're from or based if mentioned\n- story: Their story, what they're building, or what they're passionate about\n\nConversation:\n${convertMessageToCoreMessage(
          updatedMessages,
        )
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}\n\nReturn null for any field not mentioned.`,
      });

      // Determine next step based on current step and what info we have
      // Steps can only move forward: initial -> name -> location -> story -> image -> complete
      let nextStep = state.currentStep;

      if (state.currentStep === "initial" && extractionResult.object.name) {
        nextStep = "name";
      } else if (
        state.currentStep === "name" &&
        extractionResult.object.location
      ) {
        nextStep = "location";
      } else if (
        state.currentStep === "location" &&
        extractionResult.object.story
      ) {
        nextStep = "story";
      } else if (state.currentStep === "story") {
        // Always move to image step after story, regardless of extraction
        nextStep = "image";
      } else if (state.currentStep === "image") {
        // Always move to complete after image step
        nextStep = "complete";
      }

      // Only update extracted info if we don't already have it (prevent overwriting)
      const updatedExtractedName =
        state.extractedName || extractionResult.object.name;
      const updatedExtractedLocation =
        state.extractedLocation || extractionResult.object.location;
      const updatedExtractedStory =
        state.extractedOneLiner || extractionResult.object.story;

      // Update user's name in the database if extracted and not already set
      if (extractionResult.object.name && !state.extractedName) {
        await ctx.db
          .update(user)
          .set({ name: extractionResult.object.name })
          .where(eq(user.id, ctx.session.user.id));
      }

      // Update state with extracted information
      await ctx.db
        .update(onboardingState)
        .set({
          currentStep: nextStep,
          extractedName: updatedExtractedName,
          extractedLocation: updatedExtractedLocation,
          extractedOneLiner: updatedExtractedStory,
          completedAt: nextStep === "complete" ? new Date() : null,
        })
        .where(eq(onboardingState.userId, ctx.session.user.id));

      // If we've reached the complete step, automatically complete onboarding
      if (nextStep === "complete") {
        // Upsert profile: set isOnboarded: true
        await ctx.db
          .insert(profile)
          .values({
            userId: ctx.session.user.id,
            completionPercentage: 0,
            isOnboarded: true,
          })
          .onDuplicateKeyUpdate({
            set: { isOnboarded: true },
          });
      }

      yield {
        type: "step" as const,
        step: nextStep,
      };

      yield {
        type: "extracted" as const,
        data: {
          name: updatedExtractedName,
          location: updatedExtractedLocation,
          story: updatedExtractedStory,
        },
      };
    }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    // Upsert profile: set isOnboarded: true
    await ctx.db
      .insert(profile)
      .values({
        userId: ctx.session.user.id,
        completionPercentage: 0,
        isOnboarded: true,
      })
      .onDuplicateKeyUpdate({
        set: { isOnboarded: true },
      });

    // Update onboarding state
    await ctx.db
      .update(onboardingState)
      .set({ completedAt: new Date() })
      .where(eq(onboardingState.userId, ctx.session.user.id));

    return { success: true };
  }),
} satisfies TRPCRouterRecord;
